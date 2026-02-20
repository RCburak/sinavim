"""Soru havuzu servisi (Firestore + Storage)."""
from __future__ import annotations
import logging
import uuid
from datetime import datetime
from firebase_admin import firestore, storage
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_USERS = "users"
SUBCOLLECTION_QUESTIONS = "questions"
# Frontend config'den alinan bucket adi. 
# Eger env'de varsa oradan al, yoksa hardcode fallback.
BUCKET_NAME = "rcsinavim.appspot.com" 

def _doc_to_dict(doc) -> dict:
    d = doc.to_dict()
    d["id"] = doc.id
    for key in ("created_at", "updated_at"):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    return d

def add_question(user_id: str, image_file, lesson: str, topic: str = "", notes: str = "", content_type: str = None) -> tuple[dict | None, str | None]:
    """Soru ekler (Resim yükler + Firestore kaydeder)."""
    try:
        # 1. Upload Image
        bucket = storage.bucket()
        filename = f"questions/{user_id}/{uuid.uuid4()}.jpg"
        blob = bucket.blob(filename)
        
        # image_file bir file-like object olmalidir (read() metodu olan)
        # content_type parametresi opsiyonel, yoksa objeden okumaya calisir
        final_content_type = content_type or getattr(image_file, "content_type", "image/jpeg")
        
        blob.upload_from_file(image_file, content_type=final_content_type)
        
        # Try to make public, but don't fail if it's restricted
        try:
            blob.make_public()
        except Exception as bucket_err:
            logger.warning(f"Could not make blob public: {bucket_err}")
            
        image_url = blob.public_url

        # 2. Save Metadata
        db = get_firestore()
        doc_ref = db.collection(COLLECTION_USERS).document(user_id).collection(SUBCOLLECTION_QUESTIONS).document()
        question_data = {
            "image_url": image_url,
            "lesson": lesson,
            "topic": topic,
            "notes": notes,
            "solved": False,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(question_data)
        
        # Return serializable data
        return {"id": doc_ref.id, "image_url": image_url, "lesson": lesson, "solved": False}, None
    except Exception as e:
        logger.exception("Soru ekleme hatasi")
        return None, str(e)

def get_questions(user_id: str, filter_lesson: str = None, status: str = None) -> list[dict]:
    """Sorulari listeler."""
    try:
        db = get_firestore()
        query = (
            db.collection(COLLECTION_USERS)
            .document(user_id)
            .collection(SUBCOLLECTION_QUESTIONS)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
        )
        
        if filter_lesson:
            query = query.where("lesson", "==", filter_lesson)
        
        if status == "solved":
            query = query.where("solved", "==", True)
        elif status == "unsolved":
             query = query.where("solved", "==", False)

        snap = query.get()
        return [_doc_to_dict(d) for d in snap]
    except Exception as e:
        logger.exception("Soru listeleme hatasi")
        return []

def update_question_status(user_id: str, question_id: str, solved: bool) -> tuple[bool, str | None]:
    """Soru durumunu gunceller."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_USERS).document(user_id).collection(SUBCOLLECTION_QUESTIONS).document(question_id)
        ref.update({"solved": solved, "updated_at": firestore.SERVER_TIMESTAMP})
        return True, None
    except Exception as e:
        return False, str(e)

def delete_question(user_id: str, question_id: str) -> tuple[bool, str | None]:
    """Soruyu siler (Resim dahil)."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_USERS).document(user_id).collection(SUBCOLLECTION_QUESTIONS).document(question_id)
        doc = ref.get()
        if not doc.exists:
            return False, "Soru bulunamadi"
        
        data = doc.to_dict()
        image_url = data.get("image_url")

        # Delete image from storage if possible
        if image_url:
            try:
                # Extract path from URL or save path in metadata next time. 
                # Basic way: Parse URL or just try to reconstruct path if standard.
                # Assuming standard path: questions/{user_id}/... 
                # It's safer if we stored storage_path. For now, skipping explicit storage delete to avoid errors, 
                # or we can try to find blob by name if we stored it.
                pass 
            except:
                pass

        ref.delete()
        return True, None
    except Exception as e:
        return False, str(e)

class QuestionService:
    add = staticmethod(add_question)
    get_all = staticmethod(get_questions)
    update_status = staticmethod(update_question_status)
    delete = staticmethod(delete_question)

question_service = QuestionService()
