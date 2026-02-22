"""Yönetici (Admin / Kurum Sahibi) paneli rotaları (FastAPI)."""
from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from utils.responses import success_response, error_response
from services.admin_service import (
    admin_service, get_dashboard_stats, get_teacher_detail,
    get_notifications, update_settings, get_performance_report,
)
from middleware.auth import create_token, require_admin, require_staff
from schemas import (
    AdminLoginRequest,
    CreateTeacherRequest,
    DeleteTeacherRequest,
    CompleteRegistrationRequest,
    UpdateInviteCodeRequest,
    UpdateSettingsRequest,
)

admin_router = APIRouter()
templates = Jinja2Templates(directory="templates")


@admin_router.get("/panel")
def admin_panel(request: Request):
    """Admin web panelini sunar."""
    return templates.TemplateResponse("admin_panel.html", {"request": request})


@admin_router.post("/login")
def admin_login(req: AdminLoginRequest):
    """Kurum sahibi girişi."""
    admin, err = admin_service.login(req.email, req.password)
    if err:
        return error_response(err, 401)
    token = create_token(admin["id"], "admin")
    return success_response({"admin": admin, "token": token})


@admin_router.get("/teachers")
def list_teachers(admin_id: str, auth: dict = Depends(require_admin)):
    """Kurum sahibine ait öğretmen listesi."""
    if not admin_id:
        return error_response("admin_id gerekli.", 400)
    teachers = admin_service.list_teachers(admin_id)
    return success_response({"teachers": teachers})


@admin_router.post("/create-teacher")
def create_teacher(req: CreateTeacherRequest, auth: dict = Depends(require_admin)):
    """Yeni öğretmen oluşturma."""
    teacher, err = admin_service.create_teacher(req.admin_id, req.name, req.teacher_type)
    if err:
        return error_response(err, 400)
    return success_response({"teacher": teacher}, status_code=201)


@admin_router.post("/delete-teacher")
def delete_teacher(req: DeleteTeacherRequest, auth: dict = Depends(require_admin)):
    """Öğretmen silme."""
    ok, err = admin_service.delete_teacher(req.teacher_id, req.admin_id)
    if not ok:
        return error_response(err, 400)
    return success_response(message="Öğretmen silindi.")


@admin_router.get("/register/{token}")
def teacher_register_page(request: Request, token: str):
    """Öğretmen kayıt sayfasını gösterir."""
    teacher, err = admin_service.get_teacher_by_token(token)
    context = {"request": request, "token": token}
    if err:
        context.update({"error": err, "teacher": None})
    else:
        context.update({"error": None, "teacher": teacher})
    return templates.TemplateResponse("teacher_register.html", context)


@admin_router.post("/complete-registration")
def complete_registration(req: CompleteRegistrationRequest):
    """Öğretmen kaydını tamamlar."""
    ok, err = admin_service.register_teacher(
        req.token, req.email, req.password
    )
    if not ok:
        return error_response(err, 400)
    return success_response(message="Kayıt başarıyla tamamlandı! Artık giriş yapabilirsiniz.")


@admin_router.post("/update-invite-code")
def update_invite_code(req: UpdateInviteCodeRequest, auth: dict = Depends(require_admin)):
    """Öğretmen davet kodunu güncelleme."""
    ok, err = admin_service.update_invite_code(
        req.teacher_id, req.admin_id, req.new_code
    )
    if not ok:
        return error_response(err, 400)
    return success_response(message="Davet kodu güncellendi.")


# ─── Yeni Dashboard Endpointleri ──────────────────────────

@admin_router.get("/dashboard-stats")
def dashboard_stats(admin_id: str, auth: dict = Depends(require_staff)):
    """Kurum geneli istatistikler."""
    stats = get_dashboard_stats(admin_id)
    return success_response(stats)


@admin_router.get("/teacher-detail/{teacher_id}")
def teacher_detail(teacher_id: str, admin_id: str, auth: dict = Depends(require_admin)):
    """Öğretmenin detaylı bilgileri."""
    detail, err = get_teacher_detail(teacher_id, admin_id)
    if err:
        return error_response(err, 400)
    return success_response({"teacher": detail})


@admin_router.get("/notifications")
def notifications(admin_id: str, auth: dict = Depends(require_staff)):
    """Son aktiviteler / bildirimler."""
    items = get_notifications(admin_id)
    return success_response({"notifications": items})


@admin_router.post("/update-settings")
def admin_update_settings(req: UpdateSettingsRequest, auth: dict = Depends(require_admin)):
    """Kurum ayarlarını günceller."""
    ok, err = update_settings(req.admin_id, {
        "name": req.name,
        "contact_email": req.contact_email,
        "phone": req.phone,
        "address": req.address,
    })
    if not ok:
        return error_response(err, 400)
    return success_response(message="Ayarlar güncellendi.")


@admin_router.get("/performance")
def performance_report(admin_id: str, auth: dict = Depends(require_staff)):
    """Kurum geneli performans raporu."""
    report = get_performance_report(admin_id)
    return success_response(report)
