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
                "task": p.get("task") or f"{p.get('subject', '')} - {p.get('topic', '')}".strip() or "Ders",
                "duration": p.get("duration", "1 Saat"),
                "completed": bool(p.get("completed")),
                "questions": int(p.get("questions") or p.get("questionCount") or 0),
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
        # Tamamlanma oranını hesapla
        total = len(items)
        completed = sum(1 for it in items if it.get("completed"))
        completion_rate = round((completed / total) * 100) if total > 0 else 0
        program_data = json.dumps(items, ensure_ascii=False)
        db.collection(COLLECTION_PROGRAM_HISTORY).add({
            "user_id": user_id,
            "completion_rate": completion_rate,
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
            .get()
        )
        out = []
        for doc in snap:
            d = doc.to_dict()
            d["id"] = doc.id
            if "archive_date" in d and hasattr(d["archive_date"], "isoformat"):
                d["archive_date"] = d["archive_date"].isoformat()
            if "program_data" in d and isinstance(d["program_data"], str):
                try:
                    d["program_data"] = json.loads(d["program_data"])
                except:
                    d["program_data"] = []
            out.append(d)
        out.sort(key=lambda x: x.get("archive_date", ""), reverse=True)
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
    """Kullanıcı istatistiklerini ve kurum bilgisini getirir."""
    try:
        db = get_firestore()
        
        # 1. Tamamlanan görev sayısı (Geçmişten)
        snap = (
            db.collection(COLLECTION_PROGRAM_HISTORY)
            .where("user_id", "==", user_id)
            .get()
        )
        total_tasks = len(snap)

        # 2. Kurum bilgisi (Users koleksiyonundan)
        institution = None
        user_ref = db.collection("users").document(user_id)
        user_snap = user_ref.get()
        
        if user_snap.exists:
            user_data = user_snap.to_dict()
            inst_id = user_data.get("institution_id")
            user_status = user_data.get("status")
            if inst_id:
                # Kurum adını al
                inst_ref = db.collection("institutions").document(inst_id)
                inst_snap = inst_ref.get()
                if inst_snap.exists:
                    institution = {
                        "id": inst_id,
                        "name": inst_snap.to_dict().get("name", "Bilinmeyen Kurum"),
                        "status": user_status or "approved"
                    }

        return {
            "total_tasks": total_tasks,
            "total_hours": 0,
            "institution": institution
        }
    except Exception as e:
        logger.exception("Istatistik hatasi")
        return {"total_tasks": 0, "total_hours": 0, "institution": None}


class ProgramService:
    get = staticmethod(get_program)
    save = staticmethod(save_program)
    archive = staticmethod(archive_program)
    get_history = staticmethod(get_history)
    delete_history = staticmethod(delete_history)
    get_stats = staticmethod(get_user_stats)


program_service = ProgramService()
