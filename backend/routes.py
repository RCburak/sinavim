from flask import request, jsonify
from database import get_db_connection

def setup_routes(app):
    # Analizleri Getir
    @app.route('/analizler', methods=['GET'])
    def get_analizler():
        conn = get_db_connection()
        analizler = conn.execute('SELECT * FROM analizler ORDER BY id DESC').fetchall()
        conn.close()
        # Row objelerini listeye çeviriyoruz
        return jsonify([dict(ix) for ix in analizler])

    # Yeni Analiz Ekle
    @app.route('/analiz-ekle', methods=['POST'])
    def add_analiz():
        yeni_veri = request.json
        ad = yeni_veri.get('ad')
        net = yeni_veri.get('net')
        tarih = yeni_veri.get('tarih')
        
        conn = get_db_connection()
        conn.execute('INSERT INTO analizler (deneme_ad, net, tarih) VALUES (?, ?, ?)',
                     (ad, net, tarih))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Net kaydedildi!"})