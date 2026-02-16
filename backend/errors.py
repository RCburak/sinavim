import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError as PydanticValidationError

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Temel uygulama hatası."""
    status_code = 500
    message = "Sunucu hatası oluştu."

    def __init__(self, message: str = None, status_code: int = None):
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


def register_error_handlers(app: FastAPI):
    """FastAPI uygulamasına hata işleyicilerini kaydeder."""
    
    @app.exception_handler(ValidationError)
    async def handle_validation_error(request: Request, exc: ValidationError):
        logger.warning("Validation error: %s", exc.message)
        return JSONResponse(
            content={"status": "error", "message": exc.message},
            status_code=exc.status_code
        )

    @app.exception_handler(PydanticValidationError)
    async def handle_pydantic_validation_error(request: Request, exc: PydanticValidationError):
        logger.warning("Pydantic validation error: %s", exc)
        messages = []
        for err in exc.errors():
            field = str(err["loc"][-1]) if err["loc"] else "Unknown"
            msg = err["msg"]
            messages.append(f"{field}: {msg}")
        return JSONResponse(
            content={"status": "error", "message": "; ".join(messages)},
            status_code=400
        )

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(request: Request, exc: RequestValidationError):
        logger.warning("Request validation error: %s", exc)
        messages = []
        for err in exc.errors():
            # loc includes ('body', 'field') or ('query', 'field')
            loc_str = " -> ".join([str(l) for l in err["loc"]])
            msg = err["msg"]
            messages.append(f"{loc_str}: {msg}")
        return JSONResponse(
            content={"status": "error", "message": "; ".join(messages)},
            status_code=422
        )

    @app.exception_handler(NotFoundError)
    async def handle_not_found(request: Request, exc: NotFoundError):
        return JSONResponse(
            content={"status": "error", "message": exc.message},
            status_code=exc.status_code
        )

    @app.exception_handler(UnauthorizedError)
    async def handle_unauthorized(request: Request, exc: UnauthorizedError):
        return JSONResponse(
            content={"status": "error", "message": exc.message},
            status_code=exc.status_code
        )

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        logger.error("App error: %s", exc.message)
        return JSONResponse(
            content={"status": "error", "message": exc.message},
            status_code=exc.status_code
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(request: Request, exc: StarletteHTTPException):
        # Handle 404/500 from Starlette/FastAPI
        return JSONResponse(
            content={"status": "error", "message": exc.detail},
            status_code=exc.status_code
        )

    @app.exception_handler(Exception)
    async def handle_server_error(request: Request, exc: Exception):
        logger.exception("Internal server error")
        return JSONResponse(
            content={"status": "error", "message": "Sunucu hatası"},
            status_code=500
        )
