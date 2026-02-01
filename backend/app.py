from flask import Flask
from flask_cors import CORS
from routes import setup_routes
from database import init_db

app = Flask(__name__)
# CORS ayarını en geniş haliyle bırakıyoruz ki ngrok sorun çıkarmasın
CORS(app, resources={r"/*": {"origins": "*"}})

# Önce tabloları kontrol et, sonra sunucuyu aç
init_db()
setup_routes(app)

if __name__ == '__main__':
    # Terminalde 'ngrok http 8000' kullanıyorsan burası 8000 olmalı
    app.run(debug=True, host='0.0.0.0', port=8000)