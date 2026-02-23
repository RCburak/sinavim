"""RC Sınavım Backend - Ana uygulama (FastAPI)."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import config_by_name
from firebase_db import initialize_firebase
from errors import register_error_handlers

# Routers
from routes.auth import auth_router
from routes.admin import admin_router
from routes.teacher import teacher_router
from routes.questions import questions_router
from routes.program import program_router
from routes.institution import institution_router
from routes.analiz import analiz_router
from routes.friends import friends_router
from routes.flashcards import flashcards_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama yaşam döngüsü."""
    # Startup
    try:
        initialize_firebase()
        logger.info("Firebase (Firestore) basariyla baglandi.")
    except Exception as e:
        logger.error("Firebase baslatma hatasi: %s", e)
        raise
    yield
    # Shutdown
    pass


def create_app(config_name: str = None) -> FastAPI:
    """Uygulama fabrikası."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    config = config_by_name[config_name]
    is_production = config_name == "production"
    
    app = FastAPI(
        title="RC Sınavım API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )

    # CORS Configuration
    allowed_origins = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
    ]
    if not is_production:
        allowed_origins.append("*")  # Geliştirmede tüm originlere izin ver
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    )

    # Include Routers
    # Bazı rotalar Flask zamanında root'taydı, o yüzden prefix boş geçiliyor.
    app.include_router(auth_router, prefix="", tags=["Auth"])
    app.include_router(admin_router, prefix="/admin", tags=["Admin"])
    app.include_router(teacher_router, prefix="/teacher", tags=["Teacher"])
    app.include_router(questions_router, prefix="/questions", tags=["Questions"])
    app.include_router(program_router, prefix="", tags=["Program"])
    app.include_router(institution_router, prefix="", tags=["Institution"])
    app.include_router(analiz_router, prefix="", tags=["Analiz"])
    app.include_router(friends_router, prefix="/friends", tags=["Friends"])
    app.include_router(flashcards_router, prefix="/flashcards", tags=["Flashcards"])
    
    register_error_handlers(app)
    
    # Root route for testing
    @app.get("/")
    def read_root():
        return {"message": "RC Sınavım Backend is running (FastAPI)"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    print("""
    RC Sinavim Backend (FastAPI)
    ------------------------------
    Port: 8000
    ------------------------------
    """)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
