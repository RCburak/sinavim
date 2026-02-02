from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client
import json

def setup_routes(app):
    
    # --- 1. KAYIT OLMA (REGISTER) ---
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({"status": "error", "message": "Eksik bilgi!"}), 400

        try:
            with get_db_connection() as conn:
                conn.execute(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    (name, email, password)
                )
                conn.commit()
            return jsonify({"status": "success", "message": "Kayıt başarılı!"}), 201
        except Exception as e:
            # Email UNIQUE olduğu için aynı maille kayıt olunursa hata döner
            return jsonify({"status": "error", "message": "Bu e-posta zaten kullanımda!"}), 400

    # --- 2. GİRİŞ YAPMA (LOGIN) ---
    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        with get_db_connection() as conn:
            user = conn.execute(
                'SELECT * FROM users WHERE email = ? AND password = ?',
                (email, password)
            ).fetchone()

        if user:
            return jsonify({
                "status": "success", 
                "user": {"id": user['id'], "name": user['name'], "email": user['email']}
            }), 200
        else:
            return jsonify({"status": "error", "message": "Hatalı e-posta veya şifre!"}), 401

    # --- 3. ANALİZLERİ LİSTELEME (Kullanıcıya Özel) ---
    @app.route('/analizler/<int:user_id>', methods=['GET'])
    def get_analizler(user_id):
        with get_db_connection() as conn:
            # Sadece o kullanıcıya ait verileri çekiyoruz
            veriler = conn.execute(
                'SELECT id, deneme_ad as ad, net, tarih FROM analizler WHERE user_id = ? ORDER BY id DESC',
                (user_id,)
            ).fetchall()
        return jsonify([dict(row) for row in veriler])

    # --- 4. ANALİZ EKLEME (Kullanıcıya Özel) ---
    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        user_id = data.get('user_id') # Frontend'den user_id gelmeli
        with get_db_connection() as conn:
            conn.execute(
                'INSERT INTO analizler (user_id, deneme_ad, net, tarih) VALUES (?, ?, ?, ?)',
                (user_id, data.get('ad'), data.get('net'), data.get('tarih'))
            )
            conn.commit()
        return jsonify({"mesaj": "Veri başarıyla kaydedildi!"}), 201

    # --- 5. AI PROGRAM HAZIRLAMA ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        try:
            data = request.get_json()
            program = generate_ai_schedule(
                data.get('goal', 'Genel Akademik Hedef'), 
                data.get('hours', 4)
            )
            if program:
                return jsonify({"status": "success", "program": program})
            return jsonify({"status": "error", "message": "AI programı oluşturamadı"}), 500
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 6. AI ANALİZ YORUMU (Kullanıcıya Özel) ---
    @app.route('/ai-yorumla/<int:user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        with get_db_connection() as conn:
            veriler = conn.execute(
                'SELECT deneme_ad, net FROM analizler WHERE user_id = ? ORDER BY id DESC LIMIT 5',
                (user_id,)
            ).fetchall()

        if not veriler:
            return jsonify({"yorum": "Henüz analiz verisi yok. Birkaç deneme eklersen hemen yorumlayabilirim! 🚀"})

        deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])
        
        system_prompt = f"""
        Sen ciddi ve destekleyici bir eğitim koçusun. 
        Öğrencinin son deneme sonuçları: {deneme_ozeti}.
        Kısa (maks 2 cümle), akademik tavsiye veren bir yorum yap.
        """

        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": system_prompt}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except Exception as e:
            return jsonify({"yorum": "Başarıya giden yolda çalışmaya devam!"}), 200