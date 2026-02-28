"""Kurum katılım rotaları (FastAPI)."""
from fastapi import APIRouter
from utils.responses import success_response, error_response
from services.teacher_service import teacher_service
from schemas import JoinInstitutionRequest, LeaveInstitutionRequest

institution_router = APIRouter()


@institution_router.post("/join-institution")
def join_institution(req: JoinInstitutionRequest):
    """Kullanıcıyı kuruma bağlar (kod ile)."""
    institution, err = teacher_service.join_institution(
        req.code,
        user_id=req.user_id,
        email=req.email,
    )
    if err:
        return error_response(err, 404 if "Geçersiz" in err else 400)

    return success_response(
        {"institution": institution, "message": f"{institution['name']} kurumuna başarıyla katıldınız!"}
    )


@institution_router.post("/leave-institution")
def leave_institution(req: LeaveInstitutionRequest):
    """Kullanıcıyı kurumdan ayırır."""
    ok, err = teacher_service.leave_institution(req.user_id)
    if not ok:
        return error_response(err or "Kurumdan ayrılırken bir hata oluştu.", 500)

    return success_response(message="Kurumdan başarıyla ayrıldınız.")


@institution_router.get("/announcements/{institution_id}")
def get_announcements_for_student(institution_id: str, class_id: str | None = None):
    """Öğrenciler için duyuruları listeler."""
    # Note: Using public access for now as requested for simplicity in dashboard, 
    # but can add verify_token dependency if strict auth is needed.
    announcements = teacher_service.get_announcements(institution_id, class_id)
    return announcements


@institution_router.get("/events/{institution_id}")
def get_events_for_student(institution_id: str, class_id: str | None = None):
    """Öğrenciler için kurum etkinliklerini listeler."""
    events = teacher_service.get_events(institution_id, class_id)
    return events
