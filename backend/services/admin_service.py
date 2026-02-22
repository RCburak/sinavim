"""Yönetici (Admin / Kurum Sahibi) paneli servisi (Firestore).

Admin = Kurum sahibi. Her kurum sahibi kendi öğretmenlerini yönetir.
Admin girişi mevcut `institutions` koleksiyonunu kullanır.
Oluşturulan öğretmenler de `institutions` koleksiyonuna kaydedilir,
`admin_id` alanı ile hangi kurum sahibine ait olduğu belirtilir.
"""
from __future__ import annotations
import logging
import uuid
import bcrypt
from firebase_admin import firestore
from firebase_db import get_firestore

logger = logging.getLogger(__name__)

COLLECTION_INSTITUTIONS = "institutions"


def _doc_to_dict(doc) -> dict:
    d = doc.to_dict()
    d["id"] = doc.id
    for key in ("created_at",):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    return d


# ─── Admin Auth (Kurum Sahibi Girişi) ────────────────────

def admin_login(email: str, password: str) -> tuple[dict | None, str | None]:
    """Kurum sahibi girişi (institutions koleksiyonundan)."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("email", "==", email)
            .limit(1)
            .get()
        )
        if not snap:
            return None, "Hatalı giriş bilgileri."
        doc = snap[0]
        data = doc.to_dict()
        stored_pw = data.get("password", "")
        # Eski plaintext şifre desteği (geçiş dönemi)
        if stored_pw and stored_pw.startswith("$2"):
            if not bcrypt.checkpw(password.encode("utf-8"), stored_pw.encode("utf-8")):
                return None, "Hatalı giriş bilgileri."
        elif stored_pw != password:
            return None, "Hatalı giriş bilgileri."
        out = _doc_to_dict(doc)
        out.pop("password", None)
        return out, None
    except Exception as e:
        logger.exception("Admin giris hatasi")
        return None, str(e)


# ─── Teacher CRUD (Kurum sahibine bağlı) ─────────────────

def create_teacher(
    admin_id: str, name: str
) -> tuple[dict | None, str | None]:
    """Kurum sahibine bağlı yeni öğretmen oluşturur (sadece isim)."""
    try:
        db = get_firestore()

        token = uuid.uuid4().hex
        ref = db.collection(COLLECTION_INSTITUTIONS).document()
        ref.set({
            "name": name,
            "email": None,
            "password": None,
            "registration_token": token,
            "is_registered": False,
            "admin_id": admin_id,
            "created_at": firestore.SERVER_TIMESTAMP,
        })
        return {
            "id": ref.id,
            "name": name,
            "registration_token": token,
            "is_registered": False,
            "admin_id": admin_id,
        }, None
    except Exception as e:
        logger.exception("Ogretmen olusturma hatasi")
        return None, str(e)


def list_teachers(admin_id: str) -> list[dict]:
    """Kurum sahibine ait öğretmenleri listeler."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("admin_id", "==", admin_id)
            .get()
        )
        teachers = []
        for doc in snap:
            t = _doc_to_dict(doc)
            t.pop("password", None)
            teachers.append(t)
        # En yeniler üstte
        teachers.sort(key=lambda t: t.get("created_at", ""), reverse=True)
        return teachers
    except Exception as e:
        logger.exception("Ogretmen listeleme hatasi")
        return []


def get_teacher_by_token(token: str) -> tuple[dict | None, str | None]:
    """Kayıt token'ı ile öğretmen bulur."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("registration_token", "==", token)
            .limit(1)
            .get()
        )
        if not snap:
            return None, "Geçersiz veya süresi dolmuş kayıt linki."
        doc = snap[0]
        data = doc.to_dict()
        if data.get("is_registered"):
            return None, "Bu hesap zaten kayıt olmuş."
        result = {
            "id": doc.id,
            "name": data.get("name", ""),
            "email": data.get("email", ""),
        }
        return result, None
    except Exception as e:
        logger.exception("Token ile ogretmen bulma hatasi")
        return None, str(e)


def register_teacher(token: str, email: str, password: str) -> tuple[bool, str | None]:
    """Öğretmenin kaydını tamamlar (email, şifre belirler)."""
    try:
        db = get_firestore()
        snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("registration_token", "==", token)
            .limit(1)
            .get()
        )
        if not snap:
            return False, "Geçersiz kayıt token'ı."
        doc = snap[0]
        data = doc.to_dict()
        if data.get("is_registered"):
            return False, "Bu hesap zaten kayıt olmuş."

        # E-posta kontrolü
        existing_email = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("email", "==", email)
            .limit(1)
            .get()
        )
        for e_doc in existing_email:
            if e_doc.id != doc.id:
                return False, "Bu e-posta zaten kullanımda."

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        db.collection(COLLECTION_INSTITUTIONS).document(doc.id).update({
            "email": email,
            "password": hashed,
            "is_registered": True,
            "registration_token": firestore.DELETE_FIELD,
        })
        return True, None
    except Exception as e:
        logger.exception("Ogretmen kayit hatasi")
        return False, str(e)


def delete_teacher(teacher_id: str, admin_id: str) -> tuple[bool, str | None]:
    """Öğretmeni siler (sadece kendi kurumundakileri silebilir)."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_INSTITUTIONS).document(teacher_id)
        snap = ref.get()
        if not snap.exists:
            return False, "Öğretmen bulunamadı."
        data = snap.to_dict()
        if data.get("admin_id") != admin_id:
            return False, "Bu öğretmeni silme yetkiniz yok."
        ref.delete()
        return True, None
    except Exception as e:
        logger.exception("Ogretmen silme hatasi")
        return False, str(e)


def update_teacher_code(teacher_id: str, admin_id: str, new_code: str) -> tuple[bool, str | None]:
    """Öğretmenin davet kodunu günceller."""
    try:
        db = get_firestore()
        # Kodun benzersiz olup olmadığını kontrol et
        code_check = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("invite_code", "==", new_code)
            .limit(1)
            .get()
        )
        if code_check:
            # Eğer kod başka birine aitse hata ver
            if code_check[0].id != teacher_id:
                return False, "Bu kod zaten kullanımda."

        ref = db.collection(COLLECTION_INSTITUTIONS).document(teacher_id)
        snap = ref.get()
        if not snap.exists:
            return False, "Öğretmen bulunamadı."
        
        # Eğer kendi kodunu güncelliyorsa (Kurum sahibi) admin_id kontrolüne takılmasın
        if teacher_id != admin_id:
            data = snap.to_dict()
            if data.get("admin_id") != admin_id:
                return False, "Bu işlemi yapmaya yetkiniz yok."

        ref.update({"invite_code": new_code})
        return True, None
    except Exception as e:
        logger.exception("Davet kodu guncelleme hatasi")
        return False, str(e)


class AdminService:
    login = staticmethod(admin_login)
    create_teacher = staticmethod(create_teacher)
    list_teachers = staticmethod(list_teachers)
    get_teacher_by_token = staticmethod(get_teacher_by_token)
    delete_teacher = staticmethod(delete_teacher)
    update_invite_code = staticmethod(update_teacher_code)


admin_service = AdminService()
