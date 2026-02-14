"""Kimlik doğrulama ve profil rotaları."""
from flask import Blueprint, request
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.user_service import user_service

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Yeni kullanıcı kaydı."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["uid", "email", "name"])
    except ValidationError as e:
        return error_response(e.message, 400)

    result, err = user_service.register(
        data.get("uid"),
        data["email"],
        data["name"],
    )
    if err:
        return error_response(err, 400)
    return success_response(result, status_code=201)


@auth_bp.route("/login", methods=["POST"])
def login():
    """E-posta ile giriş."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["email"])
    except ValidationError as e:
        return error_response(e.message, 400)

    user, err = user_service.login(data["email"])
    if err:
        return error_response(err, 404)
    return success_response({"user": user})


@auth_bp.route("/sync-user", methods=["POST"])
def sync_user():
    """Firebase ile kullanıcı eşitleme."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["uid", "email", "name"])
    except ValidationError as e:
        return error_response(e.message, 400)

    ok, err = user_service.sync(
        data.get("uid"),
        data.get("email"),
        data.get("name"),
    )
    if err:
        return error_response(err, 500)
    return success_response(message="Kullanıcı eşitlendi")


@auth_bp.route("/update-profile", methods=["POST"])
def update_profile():
    """Profil adı güncelleme."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["user_id", "name"])
    except ValidationError as e:
        return error_response(e.message, 400)

    ok, err = user_service.update_profile(data["user_id"], data["name"])
    if err:
        return error_response(err, 500)
    return success_response(message="Profil güncellendi")
