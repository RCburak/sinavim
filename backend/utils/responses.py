"""Standart API yanıt yardımcıları (FastAPI)."""
from fastapi.responses import JSONResponse
from typing import Any, Dict


def success_response(data: Any = None, message: str = None, status_code: int = 200) -> JSONResponse:
    """Başarılı yanıt oluşturur."""
    payload: Dict[str, Any] = {"status": "success"}
    if message:
        payload["message"] = message
    if data is not None:
        if isinstance(data, dict) and "status" not in data:
            payload.update(data)
        else:
            payload["data"] = data
    return JSONResponse(content=payload, status_code=status_code)


def error_response(message: str, status_code: int = 400) -> JSONResponse:
    """Hata yanıtı oluşturur."""
    return JSONResponse(content={"status": "error", "message": message}, status_code=status_code)
