"""Öğretmen ve kurum işlemleri servisi (Firestore)."""
from __future__ import annotations
import logging
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_INSTITUTIONS = "institutions"
COLLECTION_USERS = "users"
COLLECTION_PROGRAMS = "programs"


def _doc_to_dict(doc) -> dict:
    d = doc.to_dict()
    d["id"] = doc.id
    for key in ("created_at", "archive_date"):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    return d


def join_institution(
    code: str, *, user_id: str | None = None, email: str | None = None
) -> tuple[dict | None, str | None]:
    """Kullanıcıyı kuruma bağlar. Returns: (institution_dict, error_message)"""
    if not user_id and not email:
        return None, "Kullanıcı bilgisi eksik."

    try:
        db = get_firestore()
        inst_snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("invite_code", "==", code)
            .limit(1)
            .get()
        )
        if not inst_snap:
            return None, "Geçersiz kurum kodu."
        inst_doc = inst_snap[0]
        inst_id = inst_doc.id
        inst_data = {"id": inst_id, "name": inst_doc.to_dict().get("name", "")}

        if user_id:
            db.collection(COLLECTION_USERS).document(user_id).update(
                {"institution_id": inst_id}
            )
        else:
            user_snap = (
                db.collection(COLLECTION_USERS).where("email", "==", email).limit(1).get()
            )
            if not user_snap:
                return None, "Kullanıcı bulunamadı."
            db.collection(COLLECTION_USERS).document(user_snap[0].id).update(
                {"institution_id": inst_id}
            )
        return inst_data, None
    except Exception as e:
        logger.exception("Kuruma katilma hatasi")
        return None, str(e)


def teacher_login(email: str, password: str) -> tuple[dict | None, str | None]:
    """Öğretmen girişi (institutions koleksiyonundan)."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("email", "==", email)
            .limit(1)
            .get()
        )
        if not snap:
            return None, "Hatalı giriş bilgileri"
        doc = snap[0]
        data = doc.to_dict()
        if data.get("password") != password:
            return None, "Hatalı giriş bilgileri"
        out = _doc_to_dict(doc)
        return out, None
    except Exception as e:
        logger.exception("Ogretmen giris hatasi")
        return None, str(e)


def get_students(institution_id: str) -> list[dict]:
    """Kuruma bağlı öğrencileri getirir. institution_id Firestore doc id (string)."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_USERS)
            .where("institution_id", "==", institution_id)
            .order_by("name")
            .get()
        )
        return [_doc_to_dict(d) for d in snap]
    except Exception as e:
        logger.exception("Ogrenci listesi hatasi")
        return []


def assign_program(student_id: str, program: list[dict]) -> tuple[bool, str | None]:
    """Öğrenciye haftalık program atar."""
    try:
        db = get_firestore()
        items = []
        for p in program:
            items.append({
                "gun": p.get("gun", "Pazartesi"),
                "task": p.get("task", "Ders"),
                "duration": p.get("duration", "45 dk"),
                "completed": False,
                "questions": int(p.get("questions", 0)),
            })
        db.collection(COLLECTION_PROGRAMS).document(student_id).set({"items": items})
        return True, None
    except Exception as e:
        logger.exception("Program atama hatasi")
        return False, str(e)


class TeacherService:
    join_institution = staticmethod(join_institution)
    login = staticmethod(teacher_login)
    get_students = staticmethod(get_students)
    assign_program = staticmethod(assign_program)


teacher_service = TeacherService()
