from flask import request, jsonify
from database import get_db_connection
# DÜZELTME: generate_ai_schedule importu kaldırıldı
from services import client 
import json
import logging
from psycopg2.extras import RealDictCursor

# Loglama nesnesi
logger = logging.getLogger(__name__)

def setup_routes(app):
    
    # --- 1. AUTH VE PROFİL ROTALARI ---
    @app.route('/register', methods=['POST'])
    def register():
        data = request.get_json()
        conn = get_db_connection()
        if not conn: 
            return jsonify({"status": "error", "message": "Veritabanı bağlantısı yok"}), 500
        
        try:
            cur = conn.cursor()
            cur.execute('INSERT INTO users (id, email, name) VALUES (%s, %s, %s) RETURNING id',
                        (data.get('uid'), data['email'], data['name']))
            new_id = cur.fetchone()[0]
            conn.commit()
            return jsonify({"status": "success", "id": new_id}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 400
        finally:
            conn.close()

    @app.route('/login', methods=['POST'])
    def login():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM users WHERE email = %s', (data['email'],))
            user = cur.fetchone()
            if user:
                return jsonify({"status": "success", "user": user}), 200
            else:
                return jsonify({"status": "error", "message": "Kullanıcı bulunamadı"}), 404
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/sync-user', methods=['POST'])
    def sync_user():
        data = request.get_json()
        conn = get_db_connection()
        if not conn: return jsonify({"status": "error", "message": "DB Hatası"}), 500
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO users (id, email, name) 
                VALUES (%s, %s, %s) 
                ON CONFLICT (id) DO UPDATE 
                SET email = EXCLUDED.email, name = EXCLUDED.name
            """, (data.get('uid'), data.get('email'), data.get('name')))
            conn.commit()
            return jsonify({"status": "success", "message": "Kullanıcı eşitlendi"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/update-profile', methods=['POST'])
    def update_profile():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('UPDATE users SET name = %s WHERE id = %s', (data['name'], data['user_id']))
            conn.commit()
            return jsonify({"status": "success", "message": "Profil güncellendi"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    # --- 2. KURUM VE ÖĞRETMEN ROTALARI ---
    @app.route('/join-institution', methods=['POST'])
    def join_institution():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, name FROM institutions WHERE invite_code = %s", (data.get('code'),))
            institution = cur.fetchone()
            
            if not institution:
                return jsonify({"status": "error", "message": "Geçersiz kurum kodu."}), 404
            
            if data.get('user_id'):
                cur.execute("UPDATE users SET institution_id = %s WHERE id = %s", (institution['id'], data.get('user_id')))
            elif data.get('email'):
                cur.execute("UPDATE users SET institution_id = %s WHERE email = %s", (institution['id'], data.get('email')))
            else:
                 return jsonify({"status": "error", "message": "Kullanıcı bilgisi eksik."}), 400
            
            conn.commit()
            return jsonify({"status": "success", "message": f"{institution['name']} kurumuna başarıyla katıldınız!", "institution": institution}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/teacher/login', methods=['POST'])
    def teacher_login():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM institutions WHERE email = %s", (data.get('email'),))
            teacher = cur.fetchone()
            if teacher and teacher['password'] == data.get('password'):
                return jsonify({"status": "success", "teacher": teacher}), 200
            else:
                return jsonify({"status": "error", "message": "Hatalı giriş bilgileri"}), 401
        finally:
            conn.close()

    @app.route('/teacher/students/<int:institution_id>', methods=['GET'])
    def get_my_students(institution_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT id, name, email, avatar, created_at 
                FROM users 
                WHERE institution_id = %s
                ORDER BY name ASC
            """, (institution_id,))
            return jsonify(cur.fetchall()), 200
        finally:
            conn.close()

    # --- 3. HAFTALIK PROGRAM ATAMA ROTALARI ---
    
    @app.route('/teacher/assign-program', methods=['POST'])
    def assign_program():
        """Öğretmenin öğrenciye haftalık program atadığı rota"""
        data = request.get_json()
        student_id = data.get('student_id')
        program_list = data.get('program', []) 

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            
            # 1. Önce öğrencinin mevcut programını temizleyelim
            cur.execute('DELETE FROM program WHERE user_id = %s', (student_id,))
            
            # 2. Yeni programı ekle
            for p in program_list:
                cur.execute(
                    'INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (%s, %s, %s, %s, %s, %s)',
                    (student_id, p.get('gun', 'Pazartesi'), p['task'], p.get('duration', '45 dk'), False, int(p.get('questions', 0)))
                )
            
            conn.commit()
            return jsonify({"status": "success", "message": "Haftalık program başarıyla atandı!"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    # --- 4. PROGRAM, ANALİZ VE DİĞERLERİ ---
    
    @app.route('/get-program/<user_id>', methods=['GET'])
    def get_program(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            # Günleri sıralı getirmek için CASE yapısı
            cur.execute("""
                SELECT * FROM program 
                WHERE user_id = %s 
                ORDER BY 
                    CASE gun 
                        WHEN 'Pazartesi' THEN 1 
                        WHEN 'Salı' THEN 2 
                        WHEN 'Çarşamba' THEN 3 
                        WHEN 'Perşembe' THEN 4 
                        WHEN 'Cuma' THEN 5 
                        WHEN 'Cumartesi' THEN 6 
                        WHEN 'Pazar' THEN 7 
                    END, id ASC
            """, (user_id,))
            return jsonify(cur.fetchall())
        finally:
            conn.close()

    @app.route('/save-program', methods=['POST'])
    def save_program():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM program WHERE user_id = %s', (data['user_id'],))
            for p in data.get('program', []):
                cur.execute('INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (%s, %s, %s, %s, %s, %s)',
                    (data['user_id'], p.get('gun', 'Pazartesi'), p['task'], p['duration'], 
                     True if p.get('completed') else False, int(p.get('questions', 0))))
            conn.commit()
            return jsonify({"status": "success"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/archive-program', methods=['POST'])
    def archive_program():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM program WHERE user_id = %s', (data['user_id'],))
            prog = cur.fetchall()
            if not prog: return jsonify({"status": "success", "message": "Boş"}), 200
            
            cur.execute('INSERT INTO program_history (user_id, completion_rate, program_data, program_type) VALUES (%s, %s, %s, %s)',
                (data['user_id'], 0, json.dumps(prog, ensure_ascii=False), data.get('type', 'manual')))
            cur.execute('DELETE FROM program WHERE user_id = %s', (data['user_id'],))
            conn.commit()
            return jsonify({"status": "success"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/get-history/<user_id>', methods=['GET'])
    def get_history(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM program_history WHERE user_id = %s ORDER BY archive_date DESC', (user_id,))
            rows = cur.fetchall()
            return jsonify(rows), 200
        finally:
            conn.close()

    @app.route('/delete-history/<int:id>', methods=['DELETE'])
    def delete_history(id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM program_history WHERE id = %s', (id,))
            conn.commit()
            return jsonify({"status": "success"}), 200
        finally:
            conn.close()

    @app.route('/user-stats/<user_id>', methods=['GET'])
    def get_user_stats(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT count(*) as total_tasks FROM program_history WHERE user_id = %s', (user_id,))
            res = cur.fetchone()
            return jsonify({"total_tasks": res['total_tasks'], "total_hours": 0}), 200
        finally:
            conn.close()

    # --- AI GENERATE ROTASI SİLİNDİ ---

    @app.route('/analizler/<user_id>', methods=['GET'])
    def get_analizler(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM exam_results WHERE user_id = %s ORDER BY id DESC', (user_id,))
            return jsonify(cur.fetchall())
        finally:
            conn.close()

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('INSERT INTO exam_results (user_id, lesson_name, net, date) VALUES (%s, %s, %s, CURRENT_TIMESTAMP)',
                        (data['user_id'], data['ad'], data['net']))
            conn.commit()
            return jsonify({"status": "success"}), 201
        finally:
            conn.close()

    @app.route('/analiz-sil/<int:id>', methods=['DELETE'])
    def analiz_sil(id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM exam_results WHERE id = %s', (id,))
            conn.commit()
            return jsonify({"status": "success"}), 200
        finally:
            conn.close()

    @app.route('/ai-yorumla/<user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT lesson_name, net FROM exam_results WHERE user_id = %s ORDER BY id DESC LIMIT 5', (user_id,))
            data = cur.fetchall()
            if not data: return jsonify({"yorum": "Veri yok"})
            
            summary = ", ".join([f"{d['lesson_name']}: {d['net']}" for d in data])
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": f"Öğrenci koçu olarak yorumla: {summary}"}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except Exception as e:
            return jsonify({"yorum": "Hata oluştu", "error": str(e)})
        finally:
            conn.close()