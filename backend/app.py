from flask import Flask
from flask_cors import CORS
from routes import setup_routes
from database import init_db
import logging

# Loglama sistemini kuruyoruz (Hataları terminalde daha net görmek için)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # CORS: Geliştirme aşamasında ngrok ve Expo Go için en esnek ayar
    CORS(app, resources={r"/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "ngrok-skip-browser-warning"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"]
    }})

    # Veritabanı tablolarını kontrol et ve gerekirse oluştur
    try:
        init_db()
        logger.info("✅ Veritabanı başarıyla bağlandı.")
    except Exception as e:
        logger.error(f"❌ Veritabanı başlatma hatası: {e}")

    # Rotaları uygulamaya dahil et
    setup_routes(app)
    
    return app

app = create_app()

if __name__ == '__main__':
    print("""
    🚀 RC Sınavım Backend Yayında!
    ------------------------------
    Port: 8000
    Mod: Debug (Açık)
    ------------------------------
    """)
    # host='0.0.0.0' sayesinde yerel ağdaki cihazlar ve ngrok erişebilir
    app.run(debug=True, host='0.0.0.0', port=8000)