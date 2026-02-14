"""Program ve geçmiş rotaları."""
from flask import Blueprint, request, jsonify
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.program_service import program_service

program_bp = Blueprint("program", __name__)


@program_bp.route("/get-program/<user_id>", methods=["GET"])
def get_program(user_id):
    """Kullanıcının aktif programını getirir (frontend uyumluluk için ham array)."""
    rows = program_service.get(user_id)
    return jsonify(rows)


@program_bp.route("/save-program", methods=["POST"])
def save_program():
    """Programı kaydeder."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["user_id", "program"])
    except ValidationError as e:
        return error_response(e.message, 400)

    ok, err = program_service.save(data["user_id"], data.get("program", []))
    if err:
        return error_response(err, 500)
    return success_response(message="Kaydedildi")


@program_bp.route("/archive-program", methods=["POST"])
def archive_program():
    """Programı geçmişe arşivler."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["user_id"])
    except ValidationError as e:
        return error_response(e.message, 400)

    ok, err = program_service.archive(
        data["user_id"],
        data.get("type", "manual"),
    )
    if err:
        return error_response(err, 500)
    return success_response()


@program_bp.route("/get-history/<user_id>", methods=["GET"])
def get_history(user_id):
    """Kullanıcının program geçmişini getirir (frontend uyumluluk için ham array)."""
    rows = program_service.get_history(user_id)
    return jsonify(rows)


@program_bp.route("/delete-history/<history_id>", methods=["DELETE"])
def delete_history(history_id):
    """Geçmiş kaydını siler."""
    ok, err = program_service.delete_history(history_id)
    if err:
        return error_response(err, 500)
    return success_response()


@program_bp.route("/user-stats/<user_id>", methods=["GET"])
def get_user_stats(user_id):
    """Kullanıcı istatistiklerini getirir (frontend uyumluluk için ham object)."""
    stats = program_service.get_stats(user_id)
    return jsonify(stats)
