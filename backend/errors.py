"""Özel istisna sınıfları ve merkezi hata işleyicileri."""
import logging
from flask import jsonify

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Temel uygulama hatası."""
    status_code = 500
    message = "Sunucu hatası oluştu."

    def __init__(self, message=None, status_code=None):
        super().__init__()
        if message:
            self.message = message
        if status_code:
            self.status_code = status_code


class ValidationError(AppError):
    """Veri doğrulama hatası (400)."""
    status_code = 400
    message = "Geçersiz veri."


class NotFoundError(AppError):
    """Kaynak bulunamadı (404)."""
    status_code = 404
    message = "Kayıt bulunamadı."


class UnauthorizedError(AppError):
    """Yetkisiz erişim (401)."""
    status_code = 401
    message = "Yetkisiz erişim."


def register_error_handlers(app):
    """Flask uygulamasına hata işleyicilerini kaydeder."""
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        logger.warning("Validation error: %s", error.message)
        return jsonify({"status": "error", "message": error.message}), error.status_code

    @app.errorhandler(NotFoundError)
    def handle_not_found(error):
        return jsonify({"status": "error", "message": error.message}), error.status_code

    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized(error):
        return jsonify({"status": "error", "message": error.message}), error.status_code

    @app.errorhandler(AppError)
    def handle_app_error(error):
        logger.error("App error: %s", error.message)
        return jsonify({"status": "error", "message": error.message}), error.status_code

    @app.errorhandler(400)
    def handle_bad_request(error):
        return jsonify({"status": "error", "message": error.description or "Hatalı istek"}), 400

    @app.errorhandler(404)
    def handle_not_found_default(error):
        return jsonify({"status": "error", "message": "Kaynak bulunamadı"}), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        logger.exception("Internal server error")
        return jsonify({"status": "error", "message": "Sunucu hatası"}), 500
