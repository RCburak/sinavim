from flask import Flask
from flask_cors import CORS
from routes import setup_routes

app = Flask(__name__)
CORS(app) # Frontend bağlantısı için şart

# Rotaları yükle
setup_routes(app)

if __name__ == '__main__':
    # Bilgisayarındaki yerel ağda çalışması için 0.0.0.0 kullanabilirsin
    app.run(debug=True, host='0.0.0.0', port=5000)