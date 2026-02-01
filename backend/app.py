from flask import Flask
from flask_cors import CORS
from routes import setup_routes
from database import init_db # database.py'dan çekiyoruz

app = Flask(__name__)
CORS(app)

# Veritabanını ve tabloları oluştur
init_db()

# API rotalarını yükle
setup_routes(app)

if __name__ == '__main__':
    # host='0.0.0.0' mobil cihazın bağlanabilmesi için önemli
    app.run(debug=True, host='0.0.0.0', port=5000)