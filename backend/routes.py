from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client
import json

def setup_routes(app):
    
    # --- 1. AUTH ROTALARI (Firebase ile kullanıcı yönetimi frontend'de yapılıyor) ---
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        try:
            with get_db_connection() as conn:
                # user_id artık bir string (TEXT) olarak kaydedilmeli
                conn.execute('INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
                            (data.get('uid'), data['name'], data['email']))
                conn.commit()
            return jsonify({"status": "success"}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    # --- 2. PROGRAM ROTALARI (Kullanıcıya Özel) ---
    # int:user_id kaldırıldı, artık string UID kabul ediyor
    @app.route('/get-program/<user_id>', methods=['GET'])
    def get_program(user_id):
        with get_db_connection() as conn:
            veriler = conn.execute('SELECT gun, task, duration, completed FROM program WHERE user_id = ?', (user_id,)).fetchall()
        return jsonify([dict(row) for row in veriler])

    @app.route('/save-program', methods=['POST'])
    def save_program():
        data = request.get_json()
        user_id = data.get('user_id') # Firebase UID (String)
        with get_db_connection() as conn:
            conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
            for p in data.get('program', []):
                conn.execute('INSERT INTO program (user_id, gun, task, duration, completed) VALUES (?, ?, ?, ?, ?)',
                            (user_id, p['gun'], p['task'], p['duration'], p.get('completed', 0)))
            conn.commit()
        return jsonify({"status": "success"})

    # --- 3. AI PROGRAM OLUŞTURMA ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        try:
            data = request.get_json()
            goal = data.get('goal', 'Genel Hedef')
            hours = data.get('hours', 4)
            program = generate_ai_schedule(goal, hours)
            
            if program:
                return jsonify({"status": "success", "program": program})
            return jsonify({"status": "error", "message": "AI programı oluşturamadı"}), 500
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 4. ANALİZ ROTALARI ---
    # 404 hatasını çözen düzeltme: <int:user_id> -> <user_id>
    @app.route('/analizler/<user_id>', methods=['GET'])
    def get_analizler(user_id):
        with get_db_connection() as conn:
            veriler = conn.execute('SELECT id, deneme_ad as ad, net, tarih FROM analizler WHERE user_id = ? ORDER BY id DESC', (user_id,)).fetchall()
        return jsonify([dict(row) for row in veriler])

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        user_id = data.get('user_id') # String UID
        with get_db_connection() as conn:
            conn.execute('INSERT INTO analizler (user_id, deneme_ad, net, tarih) VALUES (?, ?, ?, ?)',
                        (user_id, data['ad'], data['net'], data['tarih']))
            conn.commit()
        return jsonify({"status": "success", "mesaj": "Başarılı"}), 201

    # --- 5. AI ANALİZ YORUMU ---
    # 404 hatasını çözen düzeltme: <int:user_id> -> <user_id>
    @app.route('/ai-yorumla/<user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        try:
            with get_db_connection() as conn:
                veriler = conn.execute('SELECT deneme_ad, net FROM analizler WHERE user_id = ? ORDER BY id DESC LIMIT 5', (user_id,)).fetchall()
            
            if not veriler:
                return jsonify({"yorum": "Henüz veri yok."})

            deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": f"Eğitim koçu olarak şu sonuçları yorumla: {deneme_ozeti}"}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except:
            return jsonify({"yorum": "Analiz şu an yapılamıyor."})