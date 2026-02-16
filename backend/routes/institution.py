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
