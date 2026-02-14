"""Blueprint kayıt modülü."""
from flask import Flask
from .auth import auth_bp
from .institution import institution_bp
from .teacher import teacher_bp
from .program import program_bp
from .analiz import analiz_bp
from .questions import questions_bp


def register_blueprints(app: Flask) -> None:
    """Tüm Blueprint'leri uygulamaya kaydeder."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(institution_bp)
    app.register_blueprint(teacher_bp, url_prefix="/teacher")
    app.register_blueprint(program_bp)
    app.register_blueprint(analiz_bp)
    app.register_blueprint(questions_bp)
