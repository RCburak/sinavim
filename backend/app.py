"""RC Sınavım Backend - Ana uygulama (Firestore)."""
import os
import logging
from flask import Flask
from flask_cors import CORS

from config import config_by_name
from firebase_db import initialize_firebase
from routes import register_blueprints
from errors import register_error_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app(config_name: str | None = None) -> Flask:
    """Uygulama fabrikası."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    config = config_by_name[config_name]
    app.config.from_object(config)

    CORS(
        app,
        resources={r"/*": {
            "origins": "*",
            "allow_headers": config.CORS_HEADERS,
            "methods": config.CORS_METHODS,
        }},
    )

    try:
        initialize_firebase()
        logger.info("Firebase (Firestore) basariyla baglandi.")
    except Exception as e:
        logger.error("Firebase baslatma hatasi: %s", e)
        raise

    register_blueprints(app)
    register_error_handlers(app)
    return app


app = create_app()


if __name__ == "__main__":
    print("""
    RC Sinavim Backend (Firestore)
    ------------------------------
    Port: 8000
    ------------------------------
    """)
    app.run(debug=True, host="0.0.0.0", port=8000)
