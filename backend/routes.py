from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client # client ve servis fonksiyonlarını içe aktar
import json

def setup_routes(app):
    
    # --- 1. ANALİZLERİ LİSTELEME ---
    @app.route('/analizler', methods=['GET'])
    def get_analizler():
        # Context manager sayesinde conn.close() otomatik yapılır
        with get_db_connection() as conn:
            # Frontend 'ad' beklediği için 'deneme_ad'i alias ile çekiyoruz
            veriler = conn.execute(
                'SELECT id, deneme_ad as ad, net, tarih FROM analizler ORDER BY id DESC'
            ).fetchall()
        return jsonify([dict(row) for row in veriler])

    # --- 2. ANALİZ EKLEME ---
    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        with get_db_connection() as conn:
            conn.execute(
                'INSERT INTO analizler (deneme_ad, net, tarih) VALUES (?, ?, ?)',
                (data.get('ad'), data.get('net'), data.get('tarih'))
            )
            conn.commit()
        return jsonify({"mesaj": "Veri başarıyla kaydedildi!"}), 201

    # --- 3. ANALİZ SİLME ---
    @app.route('/analiz-sil/<int:id>', methods=['DELETE'])
    def analiz_sil(id):
        with get_db_connection() as conn:
            conn.execute('DELETE FROM analizler WHERE id = ?', (id,))
            conn.commit()
        return jsonify({"mesaj": "Veri silindi!"}), 200

    # --- 4. AI PROGRAM HAZIRLAMA ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        try:
            data = request.get_json()
            # Karmaşık AI mantığı artık services.py içinde izole edildi
            program = generate_ai_schedule(
                data.get('goal', 'Genel Akademik Hedef'), 
                data.get('hours', 4)
            )
            
            if program:
                return jsonify({"status": "success", "program": program})
            return jsonify({"status": "error", "message": "AI programı oluşturamadı"}), 500
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 5. AI ANALİZ YORUMU ---
    @app.route('/ai-yorumla', methods=['GET'])
    def ai_yorumla():
        with get_db_connection() as conn:
            veriler = conn.execute(
                'SELECT deneme_ad, net FROM analizler ORDER BY id DESC LIMIT 5'
            ).fetchall()

        if not veriler:
            return jsonify({"yorum": "Henüz analiz verisi yok. Birkaç deneme eklersen hemen yorumlayabilirim! 🚀"})

        deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])
        
        # Sadece akademik odaklı, profesyonel eğitim koçu promptu
        system_prompt = f"""
        Sen ciddi ve destekleyici bir eğitim koçusun. 
        Öğrencinin son deneme sonuçları: {deneme_ozeti}.
        Bu sonuçlara dayanarak öğrenciye kısa (maks 2 cümle), 
        akademik tavsiye veren ve motive eden bir yorum yap.
        """

        try:
            # En son model ismini kullanıyoruz
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except Exception as e:
            return jsonify({"yorum": "Netlerin üzerinde çalışmaya değer, başarılar!"}), 200