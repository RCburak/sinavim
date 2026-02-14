"""Kurum katılım rotaları."""
from flask import Blueprint, request
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.teacher_service import teacher_service

institution_bp = Blueprint("institution", __name__)


@institution_bp.route("/join-institution", methods=["POST"])
def join_institution():
    """Kullanıcıyı kuruma bağlar (kod ile)."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["code"])
    except ValidationError as e:
        return error_response(e.message, 400)

    institution, err = teacher_service.join_institution(
        data["code"],
        user_id=data.get("user_id"),
        email=data.get("email"),
    )
    if err:
        return error_response(err, 404 if "Geçersiz" in err else 400)

    return success_response(
        {"institution": institution, "message": f"{institution['name']} kurumuna başarıyla katıldınız!"}
    )
