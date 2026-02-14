"""Kullanıcı işlemleri servisi (Firestore)."""
from __future__ import annotations
import logging
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_USERS = "users"


def _user_to_dict(doc) -> dict:
    data = doc.to_dict()
    data["id"] = doc.id
    if "created_at" in data and hasattr(data["created_at"], "isoformat"):
        data["created_at"] = data["created_at"].isoformat()
    return data


def register_user(uid: str, email: str, name: str) -> tuple[dict | None, str | None]:
    """Yeni kullanıcı kaydeder. Returns: (user_data, error_message)"""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_USERS).document(uid)
        ref.set({
            "email": email,
            "name": name,
            "avatar": None,
            "institution_id": None,
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        return {"id": uid}, None
    except Exception as e:
        logger.exception("Kayit hatasi")
        return None, str(e)


def login_user(email: str) -> tuple[dict | None, str | None]:
    """E-posta ile kullanıcı arar. Returns: (user_dict, error_message)"""
    try:
        db = get_firestore()
        snap = db.collection(COLLECTION_USERS).where("email", "==", email).limit(1).get()
        if not snap:
            return None, "Kullanıcı bulunamadı"
        return _user_to_dict(snap[0]), None
    except Exception as e:
        logger.exception("Giris hatasi")
        return None, str(e)


def sync_user(uid: str, email: str, name: str) -> tuple[bool, str | None]:
    """Kullanıcıyı Firebase Auth ile eşitler (upsert)."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_USERS).document(uid)
        snap = ref.get()
        data = {"email": email, "name": name}
        if snap.exists:
            existing = snap.to_dict()
            data["avatar"] = existing.get("avatar")
            data["institution_id"] = existing.get("institution_id")
            data["created_at"] = existing.get("created_at")
        else:
            data["avatar"] = None
            data["institution_id"] = None
            data["created_at"] = firestore.SERVER_TIMESTAMP
        ref.set(data, merge=True)
        return True, None
    except Exception as e:
        logger.exception("Sync hatasi")
        return False, str(e)


def update_profile(user_id: str, name: str) -> tuple[bool, str | None]:
    """Profil adını günceller."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_USERS).document(user_id).update({"name": name})
        return True, None
    except Exception as e:
        logger.exception("Profil guncelleme hatasi")
        return False, str(e)


class UserService:
    register = staticmethod(register_user)
    login = staticmethod(login_user)
    sync = staticmethod(sync_user)
    update_profile = staticmethod(update_profile)


user_service = UserService()
