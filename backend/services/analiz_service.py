"""Deneme analizi ve AI yorum servisi (Firestore)."""
from __future__ import annotations
import logging
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_EXAM_RESULTS = "exam_results"





def _doc_to_dict(doc) -> dict:
    d = doc.to_dict()
    d["id"] = doc.id
    if "date" in d and hasattr(d["date"], "isoformat"):
        d["date"] = d["date"].isoformat()
    if "lesson_name" in d:
        d["ad"] = d["lesson_name"]
    if "date" in d:
        d["tarih"] = d["date"]
    return d


def get_analizler(user_id: str) -> list[dict]:
    """Kullanıcının deneme sonuçlarını getirir (users/{uid}/exam_results)."""
    try:
        db = get_firestore()
        # ARTIK ANA KOLEKSIYON YERINE USER ALTINDAKI SUB-COLLECTION
        snap = (
            db.collection("users").document(user_id).collection("exam_results")
            .order_by("date", direction=firestore.Query.DESCENDING)
            .get()
        )
        results = [_doc_to_dict(d) for d in snap]
        return results
    except Exception as e:
        logger.exception("Analiz getirme hatasi")
        return []


def add_analiz(user_id: str, ad: str, net: float, exam_type: str = "Diğer", date: any = None) -> tuple[bool, str | None]:
    """Yeni analiz ekler (users/{uid}/exam_results)."""
    try:
        db = get_firestore()
        
        # Tarih kontrolü
        if date:
            # Eğer string gelirse (frontend'den ISO format gelebilir)
            if isinstance(date, str):
                try:
                    from datetime import datetime
                    # Sadece YYYY-MM-DD gelirse
                    if len(date) == 10: 
                        date_obj = datetime.strptime(date, "%Y-%m-%d")
                    else:
                        date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
                    firestore_date = date_obj
                except:
                    firestore_date = firestore.SERVER_TIMESTAMP
            else:
                firestore_date = date
        else:
            firestore_date = firestore.SERVER_TIMESTAMP

        db.collection("users").document(user_id).collection("exam_results").add({
            "lesson_name": ad,
            "net": net,
            "type": exam_type,
            "date": firestore_date,
            "user_id": user_id
        })
        return True, None
    except Exception as e:
        logger.exception("Analiz ekleme hatasi")
        return False, str(e)


def delete_analiz(user_id: str, analiz_id: str) -> tuple[bool, str | None]:
    """Analizi siler (users/{uid}/exam_results/{doc_id})."""
    try:
        db = get_firestore()
        # User ID artik zorunlu cunku sub-collection
        db.collection("users").document(user_id).collection("exam_results").document(analiz_id).delete()
        return True, None
    except Exception as e:
        logger.exception("Analiz silme hatasi")
        return False, str(e)


def get_ai_yorum(user_id: str) -> str:
    """AI ile deneme yorumu üretir (DEVRE DISI)."""
    return "Yapay zeka yorum özelliği şu anda devre dışıdır."


class AnalizService:
    get_all = staticmethod(get_analizler)
    add = staticmethod(add_analiz)
    delete = staticmethod(delete_analiz)
    get_ai_yorum = staticmethod(get_ai_yorum)


analiz_service = AnalizService()
