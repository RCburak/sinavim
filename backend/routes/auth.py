"""Kimlik doğrulama ve profil rotaları (FastAPI)."""
from fastapi import APIRouter
from utils.responses import success_response, error_response
from services.user_service import user_service
from schemas import RegisterRequest, LoginRequest, SyncUserRequest, UpdateProfileRequest

auth_router = APIRouter()


@auth_router.post("/register")
def register(req: RegisterRequest):
    """Yeni kullanıcı kaydı."""
    result, err = user_service.register(
        req.uid,
        req.email,
        req.name,
    )
    if err:
        return error_response(err, 400)
    return success_response(result, status_code=201)


@auth_router.post("/login")
def login(req: LoginRequest):
    """E-posta ile giriş."""
    user, err = user_service.login(req.email)
    if err:
        return error_response(err, 404)
    return success_response({"user": user})


@auth_router.post("/sync-user")
def sync_user(req: SyncUserRequest):
    """Firebase ile kullanıcı eşitleme."""
    ok, err = user_service.sync(
        req.uid,
        req.email,
        req.name,
    )
    if err:
        return error_response(err, 500)
    return success_response(message="Kullanıcı eşitlendi")


@auth_router.post("/update-profile")
def update_profile(req: UpdateProfileRequest):
    """Profil adı güncelleme."""
    ok, err = user_service.update_profile(req.user_id, req.name)
    if err:
        return error_response(err, 500)
    return success_response(message="Profil güncellendi")
