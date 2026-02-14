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
    """Kullanıcının deneme sonuçlarını getirir."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_EXAM_RESULTS)
            .where("user_id", "==", user_id)
            .order_by("date", direction="DESCENDING")
            .get()
        )
        return [_doc_to_dict(d) for d in snap]
    except Exception as e:
        logger.exception("Analiz getirme hatasi")
        return []


def add_analiz(user_id: str, ad: str, net: float) -> tuple[bool, str | None]:
    """Yeni analiz ekler."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_EXAM_RESULTS).add({
            "user_id": user_id,
            "lesson_name": ad,
            "net": net,
            "date": firestore.SERVER_TIMESTAMP,
        })
        return True, None
    except Exception as e:
        logger.exception("Analiz ekleme hatasi")
        return False, str(e)


def delete_analiz(analiz_id: str) -> tuple[bool, str | None]:
    """Analizi siler (doc id string)."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_EXAM_RESULTS).document(analiz_id).delete()
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
