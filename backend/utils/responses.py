"""Standart API yanıt yardımcıları."""
from flask import jsonify


def success_response(data=None, message=None, status_code=200):
    """Başarılı yanıt oluşturur."""
    payload = {"status": "success"}
    if message:
        payload["message"] = message
    if data is not None:
        if isinstance(data, dict) and "status" not in data:
            payload.update(data)
        else:
            payload["data"] = data
    return jsonify(payload), status_code


def error_response(message, status_code=400):
    """Hata yanıtı oluşturur."""
    return jsonify({"status": "error", "message": message}), status_code
