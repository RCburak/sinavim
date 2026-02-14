"""Program ve geçmiş işlemleri servisi (Firestore)."""
from __future__ import annotations
import json
import logging
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_PROGRAMS = "programs"
COLLECTION_PROGRAM_HISTORY = "program_history"

GUN_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]


def _sort_program_items(items: list[dict]) -> list[dict]:
    """Program maddelerini gün sırasına göre sıralar."""
    def key_fn(x):
        g = x.get("gun", "Pazartesi")
        return (GUN_ORDER.index(g) if g in GUN_ORDER else 99, g)
    return sorted(items, key=key_fn)


def get_program(user_id: str) -> list[dict]:
    """Kullanıcının aktif programını getirir."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_PROGRAMS).document(user_id)
        snap = ref.get()
        if not snap.exists:
            return []
        data = snap.to_dict()
        items = data.get("items") or []
        for i, it in enumerate(items):
            if isinstance(it.get("completed"), bool):
                pass
            else:
                it["completed"] = bool(it.get("completed"))
            it["questions"] = int(it.get("questions", 0))
        return _sort_program_items(items)
    except Exception as e:
        logger.exception("Program getirme hatasi")
        return []


def save_program(user_id: str, program: list[dict]) -> tuple[bool, str | None]:
    """Programı kaydeder (tek dokümanda items dizisi)."""
    try:
        db = get_firestore()
        items = []
        for p in program:
            items.append({
                "gun": p.get("gun", "Pazartesi"),
                "task": p.get("task", "Ders"),
                "duration": p.get("duration", "1 Saat"),
                "completed": bool(p.get("completed")),
                "questions": int(p.get("questions", 0)),
            })
        db.collection(COLLECTION_PROGRAMS).document(user_id).set({"items": items})
        return True, None
    except Exception as e:
        logger.exception("Program kaydetme hatasi")
        return False, str(e)


def archive_program(
    user_id: str, program_type: str = "manual"
) -> tuple[bool, str | None]:
    """Aktif programı geçmişe arşivler."""
    try:
        db = get_firestore()
        prog_ref = db.collection(COLLECTION_PROGRAMS).document(user_id)
        snap = prog_ref.get()
        if not snap.exists:
            return True, None
        items = (snap.to_dict() or {}).get("items") or []
        if not items:
            return True, None
        program_data = json.dumps(items, ensure_ascii=False)
        db.collection(COLLECTION_PROGRAM_HISTORY).add({
            "user_id": user_id,
            "completion_rate": 0,
            "program_data": program_data,
            "program_type": program_type,
            "archive_date": firestore.SERVER_TIMESTAMP,
        })
        prog_ref.delete()
        return True, None
    except Exception as e:
        logger.exception("Arsiv hatasi")
        return False, str(e)


def get_history(user_id: str) -> list[dict]:
    """Kullanıcının program geçmişini getirir."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_PROGRAM_HISTORY)
            .where("user_id", "==", user_id)
            .order_by("archive_date", direction="DESCENDING")
            .get()
        )
        out = []
        for doc in snap:
            d = doc.to_dict()
            d["id"] = doc.id
            if "archive_date" in d and hasattr(d["archive_date"], "isoformat"):
                d["archive_date"] = d["archive_date"].isoformat()
            out.append(d)
        return out
    except Exception as e:
        logger.exception("Gecmis getirme hatasi")
        return []


def delete_history(history_id: str) -> tuple[bool, str | None]:
    """Geçmiş kaydını siler (Firestore doc id string)."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_PROGRAM_HISTORY).document(history_id).delete()
        return True, None
    except Exception as e:
        logger.exception("Gecmis silme hatasi")
        return False, str(e)


def get_user_stats(user_id: str) -> dict:
    """Kullanıcı istatistiklerini getirir."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_PROGRAM_HISTORY)
            .where("user_id", "==", user_id)
            .get()
        )
        return {"total_tasks": len(snap), "total_hours": 0}
    except Exception as e:
        logger.exception("Istatistik hatasi")
        return {"total_tasks": 0, "total_hours": 0}


class ProgramService:
    get = staticmethod(get_program)
    save = staticmethod(save_program)
    archive = staticmethod(archive_program)
    get_history = staticmethod(get_history)
    delete_history = staticmethod(delete_history)
    get_stats = staticmethod(get_user_stats)


program_service = ProgramService()
