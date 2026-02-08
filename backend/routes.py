from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client
import json
import logging

# Loglama nesnesi
logger = logging.getLogger(__name__)

def setup_routes(app):
    
    # --- 1. AUTH VE PROFİL ROTALARI ---
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

    @app.route('/update-profile', methods=['POST'])
    def update_profile():
        data = request.get_json()
        user_id = data.get('user_id')
        new_name = data.get('name')
        try:
            with get_db_connection() as conn:
                conn.execute('UPDATE users SET name = ? WHERE id = ?', (new_name, user_id))
                conn.commit()
            return jsonify({"status": "success", "message": "Profil güncellendi"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 2. PROGRAM VE ARŞİV ROTALARI ---
    @app.route('/get-program/<user_id>', methods=['GET'])
    def get_program(user_id):
        days_order = "CASE gun WHEN 'Pazartesi' THEN 1 WHEN 'Salı' THEN 2 WHEN 'Çarşamba' THEN 3 WHEN 'Perşembe' THEN 4 WHEN 'Cuma' THEN 5 WHEN 'Cumartesi' THEN 6 WHEN 'Pazar' THEN 7 END"
        with get_db_connection() as conn:
            veriler = conn.execute(f'SELECT gun, task, duration, completed, questions FROM program WHERE user_id = ? ORDER BY {days_order}, id ASC', (user_id,)).fetchall()
            result = [dict(row) for row in veriler]
        return jsonify(result)

    @app.route('/save-program', methods=['POST'])
    def save_program():
        data = request.get_json()
        user_id = data.get('user_id')
        program_list = data.get('program', [])
        try:
            with get_db_connection() as conn:
                conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
                for p in program_list:
                    conn.execute(
                        'INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (?, ?, ?, ?, ?, ?)',
                        (user_id, p.get('gun', 'Pazartesi'), p['task'], p['duration'], 
                         1 if p.get('completed') is True or p.get('completed') == 1 else 0,
                         int(p.get('questions', 0))) 
                    )
                conn.commit()
            return jsonify({"status": "success"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.route('/archive-program', methods=['POST'])
    def archive_program():
        """
        Programı arşive taşır. 
        Eğer program boşsa 404 yerine 200 dönerek akışı bozmaz.
        """
        data = request.get_json()
        user_id = data.get('user_id')
        prog_type = data.get('type', 'ai') 

        try:
            with get_db_connection() as conn:
                cursor = conn.execute('SELECT gun, task, duration, completed, questions FROM program WHERE user_id = ?', (user_id,))
                current_prog = [dict(row) for row in cursor.fetchall()]
                
                # --- DÜZELTME: Program boşsa hata verme, başarılı say ---
                if not current_prog:
                    return jsonify({"status": "success", "message": "Arşivlenecek veri yoktu, temizlendi."}), 200
                
                total = len(current_prog)
                completed = len([t for t in current_prog if t['completed'] == 1])
                rate = round((completed / total) * 100, 1) if total > 0 else 0
                
                conn.execute(
                    'INSERT INTO program_history (user_id, completion_rate, program_data, program_type) VALUES (?, ?, ?, ?)',
                    (user_id, rate, json.dumps(current_prog, ensure_ascii=False), prog_type)
                )
                conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
                conn.commit()
            return jsonify({"status": "success", "rate": rate, "type": prog_type}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.route('/get-history/<user_id>', methods=['GET'])
    def get_history(user_id):
        try:
            with get_db_connection() as conn:
                rows = conn.execute(
                    'SELECT id, archive_date, completion_rate, program_data, program_type FROM program_history WHERE user_id = ? ORDER BY archive_date DESC',
                    (user_id,)
                ).fetchall()
                result = [{
                    "id": row["id"],
                    "archive_date": row["archive_date"],
                    "completion_rate": row["completion_rate"],
                    "program_type": row["program_type"],
                    "program_data": json.loads(row["program_data"])
                } for row in rows]
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- YENİ EKLENEN ROTA: GEÇMİŞ SİLME ---
    @app.route('/delete-history/<int:id>', methods=['DELETE'])
    def delete_history(id):
        try:
            with get_db_connection() as conn:
                conn.execute('DELETE FROM program_history WHERE id = ?', (id,))
                conn.commit()
            return jsonify({"status": "success", "message": "Kayıt silindi"}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500

    # --- 3. İSTATİSTİK ROTALARI ---
    @app.route('/user-stats/<user_id>', methods=['GET'])
    def get_user_stats(user_id):
        try:
            total_minutes = 0
            total_tasks = 0
            with get_db_connection() as conn:
                history = conn.execute('SELECT program_data FROM program_history WHERE user_id = ?', (user_id,)).fetchall()
                for row in history:
                    tasks = json.loads(row['program_data'])
                    for t in tasks:
                        if t.get('completed') == 1 or t.get('completed') is True:
                            total_tasks += 1
                            d_str = str(t.get('duration', '0')).lower()
                            if 'saat' in d_str: total_minutes += 60
                            else:
                                try:
                                    num = int(''.join(filter(str.isdigit, d_str)))
                                    total_minutes += num
                                except: total_minutes += 45

                active = conn.execute('SELECT duration FROM program WHERE user_id = ? AND completed = 1', (user_id,)).fetchall()
                for row in active:
                    total_tasks += 1
                    d_str = str(row['duration']).lower()
                    if 'saat' in d_str: total_minutes += 60
                    else:
                        try:
                            num = int(''.join(filter(str.isdigit, d_str)))
                            total_minutes += num
                        except: total_minutes += 45
            
            return jsonify({
                "total_hours": round(total_minutes / 60, 1),
                "total_tasks": total_tasks
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # --- 4. ANALİZ VE AI ROTALARI ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        try:
            data = request.get_json()
            user_id = data.get('user_id')
            program = generate_ai_schedule(data.get('goal', 'Hedef'), data.get('hours', 4))
            
            if not program:
                return jsonify({"status": "error", "message": "AI yanıt vermedi"}), 500

            with get_db_connection() as conn:
                conn.execute('DELETE FROM program WHERE user_id = ?', (user_id,))
                for p in program:
                    conn.execute(
                        'INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (?, ?, ?, ?, ?, ?)',
                        (user_id, p['gun'], p['task'], p['duration'], 0, int(p.get('questions', 0)))
                    )
                conn.commit()

            return jsonify({"status": "success", "program": program})
        except Exception as e:
            logger.error(f"❌ Program Üretme Hatası: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500

    @app.route('/analizler/<user_id>', methods=['GET'])
    def get_analizler(user_id):
        with get_db_connection() as conn:
            veriler = conn.execute('SELECT id, deneme_ad as ad, net, tarih FROM analizler WHERE user_id = ? ORDER BY id DESC', (user_id,)).fetchall()
        return jsonify([dict(row) for row in veriler])

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        with get_db_connection() as conn:
            conn.execute('INSERT INTO analizler (user_id, deneme_ad, net, tarih) VALUES (?, ?, ?, ?)',
                        (data.get('user_id'), data['ad'], data['net'], data['tarih']))
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

    @app.route('/ai-yorumla/<user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        try:
            with get_db_connection() as conn:
                veriler = conn.execute('SELECT deneme_ad, net FROM analizler WHERE user_id = ? ORDER BY id DESC LIMIT 5', (user_id,)).fetchall()
            if not veriler: return jsonify({"yorum": "Veri yok."})
            summary = ", ".join([f"{r['deneme_ad']}: {r['net']} net" for r in veriler])
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": f"Öğrenci koçu olarak bu netleri yorumla: {summary}"}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except: return jsonify({"yorum": "Analiz şu an yapılamıyor."})