from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client
import json

def setup_routes(app):
    
    # --- 1. AUTH ROTALARI ---
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        try:
            with get_db_connection() as conn:
                conn.execute('INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
                            (data.get('uid'), data['name'], data['email']))
                conn.commit()
            return jsonify({"status": "success"}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400

    # --- 2. PROGRAM ROTALARI ---
    @app.route('/get-program/<user_id>', methods=['GET'])
    def get_program(user_id):
        with get_db_connection() as conn:
            # fetchall() sonucunu manuel olarak dict listesine çeviriyoruz
            veriler = conn.execute('SELECT gun, task, duration, completed FROM program WHERE user_id = ?', (user_id,)).fetchall()
            result = [dict(row) for row in veriler]
        return jsonify(result)

    @app.route('/save-program', methods=['POST'])
    def save_program():
        data = request.get_json()
        user_id = data.get('user_id')
        with get_db_connection() as conn:
            conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
            for p in data.get('program', []):
                conn.execute('INSERT INTO program (user_id, gun, task, duration, completed) VALUES (?, ?, ?, ?, ?)',
                            (user_id, p['gun'], p['task'], p['duration'], p.get('completed', 0)))
            conn.commit()
        return jsonify({"status": "success"})

    # --- PROGRAMI ARŞİVLEME ---
    @app.route('/archive-program', methods=['POST'])
    def archive_program():
        data = request.get_json()
        user_id = data.get('user_id')
        try:
            with get_db_connection() as conn:
                # 1. Mevcut programı çek ve manuel mapping yap
                cursor = conn.execute('SELECT gun, task, duration, completed FROM program WHERE user_id = ?', (user_id,))
                current_prog = [
                    {"gun": row["gun"], "task": row["task"], "duration": row["duration"], "completed": row["completed"]} 
                    for row in cursor.fetchall()
                ]
                
                if not current_prog:
                    return jsonify({"status": "error", "message": "Program bulunamadı"}), 404
                
                # 2. Başarı oranını hesapla
                total = len(current_prog)
                completed = len([t for t in current_prog if t['completed'] == 1])
                rate = round((completed / total) * 100, 1) if total > 0 else 0
                
                # 3. Arşive JSON olarak ekle
                conn.execute(
                    'INSERT INTO program_history (user_id, completion_rate, program_data) VALUES (?, ?, ?)',
                    (user_id, rate, json.dumps(current_prog, ensure_ascii=False))
                )
                
                # 4. Aktif programı temizle
                conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
                conn.commit()
            return jsonify({"status": "success", "rate": rate}), 200
        except Exception as e:
            print(f"ARŞİVLEME HATASI: {str(e)}") # Python terminalinde hatayı yakalamak için
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- GEÇMİŞ LİSTESİNİ GETİRME ---
    @app.route('/get-history/<user_id>', methods=['GET'])
    def get_history(user_id):
        try:
            with get_db_connection() as conn:
                cursor = conn.execute(
                    'SELECT id, archive_date, completion_rate, program_data FROM program_history WHERE user_id = ? ORDER BY archive_date DESC',
                    (user_id,)
                )
                rows = cursor.fetchall()
                
                result = []
                for row in rows:
                    # Manuel veri dönüşümü hata payını azaltır
                    result.append({
                        "id": row["id"],
                        "archive_date": row["archive_date"],
                        "completion_rate": row["completion_rate"],
                        "program_data": json.loads(row["program_data"])
                    })
            return jsonify(result), 200
        except Exception as e:
            print(f"GEÇMİŞ ÇEKME HATASI: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 3. AI ROTALARI ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        try:
            data = request.get_json()
            program = generate_ai_schedule(data.get('goal', 'Genel Hedef'), data.get('hours', 4))
            return jsonify({"status": "success", "program": program}) if program else (jsonify({"status": "error"}), 500)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 4. ANALİZ ROTALARI ---
    @app.route('/analizler/<user_id>', methods=['GET'])
    def get_analizler(user_id):
        with get_db_connection() as conn:
            veriler = conn.execute('SELECT id, deneme_ad as ad, net, tarih FROM analizler WHERE user_id = ? ORDER BY id DESC', (user_id,)).fetchall()
        return jsonify([dict(row) for row in veriler])

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        user_id = data.get('user_id')
        with get_db_connection() as conn:
            conn.execute('INSERT INTO analizler (user_id, deneme_ad, net, tarih) VALUES (?, ?, ?, ?)',
                        (user_id, data['ad'], data['net'], data['tarih']))
            conn.commit()
        return jsonify({"status": "success"}), 201

    @app.route('/analiz-sil/<int:id>', methods=['DELETE'])
    def analiz_sil(id):
        try:
            with get_db_connection() as conn:
                conn.execute('DELETE FROM analizler WHERE id = ?', (id,))
                conn.commit()
            return jsonify({"status": "success"}), 200
        except Exception as e:
            return jsonify({"status": "error"}), 500

    # --- AI ANALİZ YORUMU ---
    @app.route('/ai-yorumla/<user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        try:
            with get_db_connection() as conn:
                veriler = conn.execute('SELECT deneme_ad, net FROM analizler WHERE user_id = ? ORDER BY id DESC LIMIT 5', (user_id,)).fetchall()
            if not veriler: return jsonify({"yorum": "Henüz veri yok."})
            deneme_ozeti = ", ".join([f"{row['deneme_ad']}: {row['net']} net" for row in veriler])
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": f"Eğitim koçu olarak şu sonuçları yorumla: {deneme_ozeti}"}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except: return jsonify({"yorum": "Analiz şu an yapılamıyor."})