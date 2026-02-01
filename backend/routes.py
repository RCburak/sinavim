from flask import request, jsonify
from database import get_db_connection
from services import client 
import json

def setup_routes(app):
    # --- YENİ: VERİ SİLME ROTASI ---
    @app.route('/analiz-sil/<int:id>', methods=['DELETE'])
    def analiz_sil(id):
        conn = get_db_connection()
        conn.execute('DELETE FROM analizler WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({"mesaj": "Veri başarıyla silindi!"}), 200

    @app.route('/analizler', methods=['GET'])
    def get_analizler():
        conn = get_db_connection()
        veriler = conn.execute('SELECT id, deneme_ad as ad, net, tarih FROM analizler ORDER BY id DESC').fetchall()
        conn.close()
        return jsonify([dict(row) for row in veriler])

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        yeni_veri = request.get_json()
        ad = yeni_veri.get('ad')
        net = yeni_veri.get('net')
        tarih = yeni_veri.get('tarih')

        conn = get_db_connection()
        conn.execute('INSERT INTO analizler (deneme_ad, net, tarih) VALUES (?, ?, ?)',
                     (ad, net, tarih))
        conn.commit()
        conn.close()
        return jsonify({"mesaj": "Veri kaydedildi!"}), 201

    @app.route('/ai-yorumla', methods=['GET'])
    def ai_yorumla():
        conn = get_db_connection()
        veriler = conn.execute('SELECT deneme_ad, net FROM analizler ORDER BY id DESC LIMIT 5').fetchall()
        conn.close()

        if not veriler:
            return jsonify({"yorum": "Henüz analiz edilecek kadar verimiz yok Burak. Birkaç deneme ekle, hemen yorumlayayım! 🚀"})

        deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])

        system_prompt = f"""
        Sen Burak'ın eğitim koçusun. Burak yazılım geliştirme (Python, React Native) ve oyunlarla ilgileniyor.
        Onun son deneme netleri şunlar: {deneme_ozeti}
        
        Bu verileri analiz et ve Burak'a kısa (maks 3 cümle), samimi, motive edici ve yazılım dünyasından 
        benzetmeler içeren bir geri bildirim ver.
        """

        try:
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "system", "content": system_prompt}]
            )
            yorum = completion.choices[0].message.content
            return jsonify({"yorum": yorum})
        except Exception as e:
            return jsonify({"yorum": "AI şu an biraz meşgul, ama netlerin bende güvende! 👍"}), 500