"""Uygulama konfigürasyonu."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Temel konfigürasyon."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    CORS_METHODS = ["GET", "POST", "DELETE", "OPTIONS", "PUT"]
    CORS_HEADERS = ["Content-Type", "ngrok-skip-browser-warning", "Authorization"]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
