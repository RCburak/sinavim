"""Deneme analizi ve AI yorum rotaları."""
from flask import Blueprint, request, jsonify
from utils.responses import success_response, error_response
from utils.validators import require_keys
from errors import ValidationError
from services.analiz_service import analiz_service

analiz_bp = Blueprint("analiz", __name__)


@analiz_bp.route("/analizler/<user_id>", methods=["GET"])
def get_analizler(user_id):
    """Kullanıcının deneme sonuçlarını getirir (frontend uyumluluk için ham array)."""
    rows = analiz_service.get_all(user_id)
    return jsonify(rows)


@analiz_bp.route("/analiz-ekle", methods=["POST"])
def analiz_ekle():
    """Yeni analiz ekler."""
    data = request.get_json(silent=True) or {}
    try:
        require_keys(data, ["user_id", "ad", "net"])
    except ValidationError as e:
        return error_response(e.message, 400)

    try:
        net = float(data["net"])
    except (ValueError, TypeError):
        return error_response("Geçersiz net değeri", 400)
    
    exam_type = data.get("type", "Diğer")
    date_val = data.get("date", None) # Optional, service handles defaults

    ok, err = analiz_service.add(data["user_id"], data["ad"], net, exam_type, date_val)
    if err:
        return error_response(err, 500)
    return success_response(message="Eklendi", status_code=201)


@analiz_bp.route("/analiz-sil/<analiz_id>", methods=["DELETE"])
def analiz_sil(analiz_id):
    """Analizi siler (user_id query param gerekli)."""
    user_id = request.args.get("user_id")
    if not user_id:
        return error_response("user_id parametresi gerekli", 400)
        
    ok, err = analiz_service.delete(user_id, analiz_id)
    if err:
        return error_response(err, 500)
    return success_response()


@analiz_bp.route("/ai-yorumla/<user_id>", methods=["GET"])
def ai_yorumla(user_id):
    """AI ile deneme yorumu üretir (frontend uyumluluk için ham object)."""
    try:
        yorum = analiz_service.get_ai_yorum(user_id)
        return jsonify({"yorum": yorum})
    except Exception as e:
        return error_response(f"Yorum hatası: {str(e)}", 500)
