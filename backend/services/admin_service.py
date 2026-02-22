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
    register_teacher = staticmethod(register_teacher)


admin_service = AdminService()


# ─── Dashboard Stats ──────────────────────────────────────

def get_dashboard_stats(admin_id: str) -> dict:
    """Kurum geneli istatistikleri döndürür."""
    try:
        db = get_firestore()

        # Tüm öğretmen ID'lerini al
        teacher_snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("admin_id", "==", admin_id)
            .get()
        )
        teacher_ids = [d.id for d in teacher_snap]
        all_inst_ids = [admin_id] + teacher_ids

        # Öğrenci sayıları
        total_students = 0
        pending_students = 0
        approved_students = 0
        for inst_id in all_inst_ids:
            snap = (
                db.collection("users")
                .where("institution_id", "==", inst_id)
                .get()
            )
            for doc in snap:
                total_students += 1
                st = doc.to_dict().get("status", "approved")
                if st == "pending":
                    pending_students += 1
                else:
                    approved_students += 1

        # Sınıf sayısı
        total_classes = 0
        for inst_id in all_inst_ids:
            classes_snap = (
                db.collection(COLLECTION_INSTITUTIONS)
                .document(inst_id)
                .collection("classes")
                .get()
            )
            total_classes += len(list(classes_snap))

        return {
            "total_teachers": len(teacher_ids),
            "registered_teachers": sum(1 for d in teacher_snap if d.to_dict().get("is_registered")),
            "total_students": total_students,
            "approved_students": approved_students,
            "pending_students": pending_students,
            "total_classes": total_classes,
        }
    except Exception as e:
        logger.exception("Dashboard stats hatasi")
        return {}


def get_teacher_detail(teacher_id: str, admin_id: str) -> tuple[dict | None, str | None]:
    """Öğretmenin detaylı bilgilerini döndürür (öğrenci/sınıf sayısı)."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_INSTITUTIONS).document(teacher_id)
        snap = ref.get()
        if not snap.exists:
            return None, "Öğretmen bulunamadı."
        data = snap.to_dict()
        if teacher_id != admin_id and data.get("admin_id") != admin_id:
            return None, "Bu öğretmeni görme yetkiniz yok."

        teacher = _doc_to_dict(snap)
        teacher.pop("password", None)

        # Öğrenciler
        students_snap = (
            db.collection("users")
            .where("institution_id", "==", teacher_id)
            .get()
        )
        students = []
        for s in students_snap:
            sd = s.to_dict()
            students.append({
                "id": s.id,
                "name": sd.get("name", ""),
                "email": sd.get("email", ""),
                "status": sd.get("status", "approved"),
                "class_id": sd.get("class_id"),
            })

        # Sınıflar
        classes_snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .document(teacher_id)
            .collection("classes")
            .get()
        )
        classes = [{"id": c.id, **c.to_dict()} for c in classes_snap]

        teacher["students"] = students
        teacher["classes"] = classes
        teacher["student_count"] = len(students)
        teacher["class_count"] = len(classes)

        return teacher, None
    except Exception as e:
        logger.exception("Ogretmen detay hatasi")
        return None, str(e)


def get_notifications(admin_id: str, limit: int = 20) -> list[dict]:
    """Son aktiviteleri getirir (yeni öğrenci katılımları, öğretmen kayıtları)."""
    try:
        db = get_firestore()
        notifications = []

        # Öğretmen ID'leri
        teacher_snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("admin_id", "==", admin_id)
            .get()
        )
        all_inst_ids = [admin_id] + [d.id for d in teacher_snap]

        # Yeni kayıtlı öğretmenler
        for doc in teacher_snap:
            data = doc.to_dict()
            created = data.get("created_at")
            notifications.append({
                "type": "teacher_registered" if data.get("is_registered") else "teacher_created",
                "message": f"{'✅' if data.get('is_registered') else '⏳'} {data.get('name', 'Öğretmen')} {'kaydını tamamladı' if data.get('is_registered') else 'oluşturuldu, kayıt bekliyor'}",
                "date": created.isoformat() if hasattr(created, "isoformat") else str(created) if created else "",
                "icon": "person-add",
            })

        # Son katılan öğrenciler
        for inst_id in all_inst_ids:
            students_snap = (
                db.collection("users")
                .where("institution_id", "==", inst_id)
                .get()
            )
            for doc in students_snap:
                data = doc.to_dict()
                created = data.get("created_at")
                notifications.append({
                    "type": "student_joined",
                    "message": f"👤 {data.get('name', 'Öğrenci')} kuruma katıldı{'  (onay bekliyor)' if data.get('status') == 'pending' else ''}",
                    "date": created.isoformat() if hasattr(created, "isoformat") else str(created) if created else "",
                    "icon": "school",
                })

        # Tarihe göre sırala (en yeni önce)
        notifications.sort(key=lambda n: n.get("date", ""), reverse=True)
        return notifications[:limit]
    except Exception as e:
        logger.exception("Bildirim hatasi")
        return []


def update_settings(admin_id: str, settings: dict) -> tuple[bool, str | None]:
    """Kurum ayarlarını günceller."""
    try:
        db = get_firestore()
        ref = db.collection(COLLECTION_INSTITUTIONS).document(admin_id)
        snap = ref.get()
        if not snap.exists:
            return False, "Kurum bulunamadı."

        update_data = {}
        if "name" in settings:
            update_data["name"] = settings["name"]
        if "contact_email" in settings:
            update_data["contact_email"] = settings["contact_email"]
        if "phone" in settings:
            update_data["phone"] = settings["phone"]
        if "address" in settings:
            update_data["address"] = settings["address"]

        if update_data:
            ref.update(update_data)
        return True, None
    except Exception as e:
        logger.exception("Ayar guncelleme hatasi")
        return False, str(e)


def get_performance_report(admin_id: str) -> dict:
    """Kurum geneli performans raporu (öğrenci deneme ortalamaları)."""
    try:
        db = get_firestore()

        # Tüm öğretmen ID'leri
        teacher_snap = (
            db.collection(COLLECTION_INSTITUTIONS)
            .where("admin_id", "==", admin_id)
            .get()
        )
        all_inst_ids = [admin_id] + [d.id for d in teacher_snap]

        # Tüm öğrencileri bul
        all_students = []
        for inst_id in all_inst_ids:
            snap = (
                db.collection("users")
                .where("institution_id", "==", inst_id)
                .get()
            )
            for doc in snap:
                sd = doc.to_dict()
                if sd.get("status") != "pending":
                    all_students.append({"id": doc.id, "name": sd.get("name", "")})

        # Her öğrencinin deneme sonuçlarını al
        student_results = []
        total_net = 0
        total_exam_count = 0
        exam_type_stats = {}

        for student in all_students:
            exams = (
                db.collection("users")
                .document(student["id"])
                .collection("exam_results")
                .get()
            )
            exam_list = list(exams)
            if not exam_list:
                continue

            nets = [e.to_dict().get("net", 0) for e in exam_list]
            avg_net = sum(nets) / len(nets) if nets else 0
            total_net += sum(nets)
            total_exam_count += len(nets)

            student_results.append({
                "id": student["id"],
                "name": student["name"],
                "exam_count": len(nets),
                "avg_net": round(avg_net, 2),
                "best_net": round(max(nets), 2) if nets else 0,
            })

            # Tür bazlı istatistik
            for e in exam_list:
                ed = e.to_dict()
                etype = ed.get("type", "Diğer")
                if etype not in exam_type_stats:
                    exam_type_stats[etype] = {"count": 0, "total_net": 0}
                exam_type_stats[etype]["count"] += 1
                exam_type_stats[etype]["total_net"] += ed.get("net", 0)

        # Ortalamaları hesapla
        for etype in exam_type_stats:
            stats = exam_type_stats[etype]
            stats["avg_net"] = round(stats["total_net"] / stats["count"], 2) if stats["count"] > 0 else 0

        # En iyilere göre sırala
        student_results.sort(key=lambda s: s["avg_net"], reverse=True)

        return {
            "total_students": len(all_students),
            "students_with_exams": len(student_results),
            "total_exams": total_exam_count,
            "overall_avg_net": round(total_net / total_exam_count, 2) if total_exam_count > 0 else 0,
            "student_rankings": student_results[:20],  # Top 20
            "exam_type_stats": exam_type_stats,
        }
    except Exception as e:
        logger.exception("Performans raporu hatasi")
        return {}
