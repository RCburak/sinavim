"""Öğretmen ve kurum işlemleri servisi (Firestore)."""
from __future__ import annotations
import logging
import bcrypt
from firebase_admin import firestore
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
            ref = db.collection(COLLECTION_USERS).document(user_id)
            snap = ref.get()
            if snap.exists:
                ref.update({"institution_id": inst_id, "status": "pending", "class_id": None})
            else:
                # sync-user henüz çağrılmamış olabilir, dokümanı oluştur
                ref.set({
                    "email": email or "",
                    "name": email.split("@")[0] if email else "Öğrenci",
                    "avatar": None,
                    "institution_id": inst_id,
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "status": "pending",  # Onay bekliyor
                    "class_id": None,
                }, merge=True)
        else:
            user_snap = (
                db.collection(COLLECTION_USERS).where("email", "==", email).limit(1).get()
            )
            if not user_snap:
                return None, "Kullanıcı bulunamadı."
            
            # Var olan kullanıcı kuruma katılıyor - status pending yap
            db.collection(COLLECTION_USERS).document(user_snap[0].id).update(
                {"institution_id": inst_id, "status": "pending", "class_id": None}
            )
        return inst_data, None
    except Exception as e:
        logger.exception("Kuruma katilma hatasi")
        return None, str(e)


def leave_institution(user_id: str) -> tuple[bool, str | None]:
    """Kullanıcıyı kurumdan ayırır."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_USERS).document(user_id)
        
        # Kullanıcının mevcut durumunu kontrol et
        snap = ref.get()
        if not snap.exists:
            return False, "Kullanıcı bulunamadı."
            
        # Kurum ve sınıf bilgisini sıfırla
        ref.update({
            "institution_id": None,
            "class_id": None,
            "status": None # Durumu da sıfırla
        })
        return True, None
    except Exception as e:
        logger.exception("Kurumdan ayrilma hatasi")
        return False, str(e)


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
        stored_pw = data.get("password", "")
        # Eski plaintext şifre desteği (geçiş dönemi)
        if stored_pw and stored_pw.startswith("$2"):
            if not bcrypt.checkpw(password.encode("utf-8"), stored_pw.encode("utf-8")):
                return None, "Hatalı giriş bilgileri"
        elif stored_pw != password:
            return None, "Hatalı giriş bilgileri"
        out = _doc_to_dict(doc)
        return out, None
    except Exception as e:
        logger.exception("Ogretmen giris hatasi")
        return None, str(e)


def get_students(institution_id: str, teacher_type: str = "teacher", admin_id: str | None = None) -> list[dict]:
    """Kuruma bağlı öğrencileri getirir.
    Rehber öğretmen ise admin_id üzerinden tüm kuruma bağlı öğrencileri döndürür.
    """
    try:
        db = get_firestore()

        if teacher_type == "rehber" and admin_id:
            # Rehber: admin'e bağlı tüm öğretmenlerin öğrencilerini getir
            teacher_snap = (
                db.collection(COLLECTION_INSTITUTIONS)
                .where("admin_id", "==", admin_id)
                .get()
            )
            all_inst_ids = [admin_id] + [d.id for d in teacher_snap]
            # Kendisi de dahil
            if institution_id not in all_inst_ids:
                all_inst_ids.append(institution_id)

            all_students = []
            seen_ids = set()
            for inst_id in all_inst_ids:
                snap = (
                    db.collection(COLLECTION_USERS)
                    .where("institution_id", "==", inst_id)
                    .get()
                )
                for d in snap:
                    if d.id not in seen_ids:
                        seen_ids.add(d.id)
                        s = _doc_to_dict(d)
                        if "status" not in s: s["status"] = "approved"
                        if "class_id" not in s: s["class_id"] = None
                        s["teacher_institution_id"] = inst_id
                        all_students.append(s)
            all_students.sort(key=lambda s: s.get("name", ""))
            return all_students
        else:
            # Normal öğretmen: sadece kendi öğrencileri
            snap = (
                db.collection(COLLECTION_USERS)
                .where("institution_id", "==", institution_id)
                .get()
            )
            students = [_doc_to_dict(d) for d in snap]
            for s in students:
                if "status" not in s: s["status"] = "approved"
                if "class_id" not in s: s["class_id"] = None
            students.sort(key=lambda s: s.get("name", ""))
            return students
    except Exception as e:
        logger.exception("Ogrenci listesi hatasi")
        return []

def approve_student(student_id: str) -> tuple[bool, str | None]:
    """Öğrenciyi onaylar (status=approved)."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_USERS).document(student_id).update({"status": "approved"})
        return True, None
    except Exception as e:
        return False, str(e)

def create_class(institution_id: str, name: str) -> tuple[dict | None, str | None]:
    """Yeni sınıf oluşturur."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_INSTITUTIONS).document(institution_id).collection("classes").add({
            "name": name,
            "created_at": firestore.SERVER_TIMESTAMP
        })
        return {"id": ref[1].id, "name": name}, None
    except Exception as e:
        return None, str(e)

def get_classes(institution_id: str) -> list[dict]:
    """Kurumun sınıflarını getirir."""
    try:
        db = get_firestore()
        snap = db.collection(COLLECTION_INSTITUTIONS).document(institution_id).collection("classes").order_by("name").get()
        return [{"id": d.id, **d.to_dict()} for d in snap]
    except Exception as e:
        return []

def update_student_class(student_id: str, class_id: str | None) -> tuple[bool, str | None]:
    """Öğrenciyi sınıfa atar."""
    try:
        db = get_firestore()
        db.collection(COLLECTION_USERS).document(student_id).update({"class_id": class_id})
        return True, None
    except Exception as e:
        return False, str(e)

def assign_program(student_id: str, program: list[dict]) -> tuple[bool, str | None]:
    """Öğrenciye haftalık program atar."""
    try:
        db = get_firestore()
        items = []
        for p in program:
            items.append({
                "gun": p.get("gun", "Pazartesi"),
                "task": p.get("task") or f"{p.get('subject', '')} - {p.get('topic', '')}".strip() or "Ders",
                "duration": p.get("duration", "45 dk"),
                "completed": False,
                "questions": int(p.get("questions") or p.get("questionCount") or 0),
            })
        db.collection(COLLECTION_PROGRAMS).document(student_id).set({"items": items})
        return True, None
    except Exception as e:
        logger.exception("Program atama hatasi")
        return False, str(e)


def delete_class(institution_id: str, class_id: str) -> tuple[bool, str | None]:
    """Sınıfı siler ve öğrencilerin class_id'sini temizler."""
    try:
        db = get_firestore()
        # Sınıfı sil
        db.collection(COLLECTION_INSTITUTIONS).document(institution_id).collection("classes").document(class_id).delete()
        # Bu sınıftaki öğrencilerin class_id'sini temizle
        students = db.collection(COLLECTION_USERS).where("class_id", "==", class_id).get()
        for s in students:
            db.collection(COLLECTION_USERS).document(s.id).update({"class_id": None})
        return True, None
    except Exception as e:
        logger.exception("Sinif silme hatasi")
        return False, str(e)


class TeacherService:
    join_institution = staticmethod(join_institution)
    leave_institution = staticmethod(leave_institution)
    login = staticmethod(teacher_login)
    get_students = staticmethod(get_students)
    assign_program = staticmethod(assign_program)
    approve_student = staticmethod(approve_student)
    create_class = staticmethod(create_class)
    get_classes = staticmethod(get_classes)
    update_student_class = staticmethod(update_student_class)
    delete_class = staticmethod(delete_class)


teacher_service = TeacherService()
