from flask import request, jsonify
from database import get_db_connection
from services import generate_ai_schedule, client, get_performance_insight
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
            # Firebase UID'sini (id) veritabanına kaydediyoruz.
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

    # --- YENİ EKLENEN ROTA: KULLANICI EŞİTLEME (SYNC) ---
    @app.route('/sync-user', methods=['POST'])
    def sync_user():
        """Firebase ile giriş yapan kullanıcıyı veritabanına kaydeder/eşitle."""
        data = request.get_json()
        conn = get_db_connection()
        if not conn: return jsonify({"status": "error", "message": "DB Hatası"}), 500
        
        try:
            cur = conn.cursor()
            # Kullanıcı varsa bilgilerini güncelle, yoksa yeni oluştur (Upsert)
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
        user_id = data.get('user_id')
        new_name = data.get('name')
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('UPDATE users SET name = %s WHERE id = %s', (new_name, user_id))
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
        invite_code = data.get('code') 
        user_id = data.get('user_id')
        email = data.get('email') 
        
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # 1. Kodu kontrol et
            cur.execute("SELECT id, name FROM institutions WHERE invite_code = %s", (invite_code,))
            institution = cur.fetchone()
            
            if not institution:
                return jsonify({"status": "error", "message": "Geçersiz kurum kodu."}), 404
            
            # 2. Öğrenciyi güncelle
            if user_id:
                cur.execute("UPDATE users SET institution_id = %s WHERE id = %s", (institution['id'], user_id))
            elif email:
                cur.execute("UPDATE users SET institution_id = %s WHERE email = %s", (institution['id'], email))
            else:
                 return jsonify({"status": "error", "message": "Kullanıcı bilgisi eksik."}), 400
            
            conn.commit()
            
            return jsonify({
                "status": "success", 
                "message": f"{institution['name']} kurumuna başarıyla katıldınız!", 
                "institution": institution
            }), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/teacher/login', methods=['POST'])
    def teacher_login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM institutions WHERE email = %s", (email,))
            teacher = cur.fetchone()
            
            if teacher and teacher['password'] == password:
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
            students = cur.fetchall()
            return jsonify(students), 200
        finally:
            conn.close()

    @app.route('/teacher/assign-task', methods=['POST'])
    def assign_task():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO tasks (institution_id, student_id, title, description, due_date)
                VALUES (%s, %s, %s, %s, %s)
            """, (data['institution_id'], data['student_id'], data['title'], data.get('description'), data.get('due_date')))
            conn.commit()
            return jsonify({"status": "success", "message": "Görev başarıyla atandı"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    # --- 3. PROGRAM VE ARŞİV ROTALARI ---
    @app.route('/get-program/<user_id>', methods=['GET'])
    def get_program(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
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
            result = cur.fetchall()
            return jsonify(result)
        except Exception as e:
             return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/save-program', methods=['POST'])
    def save_program():
        data = request.get_json()
        user_id = data.get('user_id')
        program_list = data.get('program', [])
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM program WHERE user_id = %s', (user_id,))
            for p in program_list:
                cur.execute(
                    'INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (%s, %s, %s, %s, %s, %s)',
                    (user_id, p.get('gun', 'Pazartesi'), p['task'], p['duration'], 
                     True if (p.get('completed') is True or p.get('completed') == 1) else False,
                     int(p.get('questions', 0))) 
                )
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
        user_id = data.get('user_id')
        prog_type = data.get('type', 'ai') 

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT gun, task, duration, completed, questions FROM program WHERE user_id = %s', (user_id,))
            current_prog = cur.fetchall()
            
            if not current_prog:
                return jsonify({"status": "success", "message": "Arşivlenecek veri yoktu."}), 200
            
            total = len(current_prog)
            completed = len([t for t in current_prog if t['completed'] is True or t['completed'] == 1])
            rate = round((completed / total) * 100, 1) if total > 0 else 0
            
            cur.execute(
                'INSERT INTO program_history (user_id, completion_rate, program_data, program_type) VALUES (%s, %s, %s, %s)',
                (user_id, rate, json.dumps(current_prog, ensure_ascii=False), prog_type)
            )
            cur.execute('DELETE FROM program WHERE user_id = %s', (user_id,))
            conn.commit()
            return jsonify({"status": "success", "rate": rate, "type": prog_type}), 200
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
            cur.execute(
                'SELECT id, archive_date, completion_rate, program_data, program_type FROM program_history WHERE user_id = %s ORDER BY archive_date DESC',
                (user_id,)
            )
            rows = cur.fetchall()
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
        finally:
            conn.close()

    @app.route('/delete-history/<int:id>', methods=['DELETE'])
    def delete_history(id):
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM program_history WHERE id = %s', (id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Kayıt silindi"}), 200
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    # --- 4. İSTATİSTİK ROTALARI ---
    @app.route('/user-stats/<user_id>', methods=['GET'])
    def get_user_stats(user_id):
        conn = get_db_connection()
        try:
            total_minutes = 0
            total_tasks = 0
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Geçmiş programlardan hesaplama
            cur.execute('SELECT program_data FROM program_history WHERE user_id = %s', (user_id,))
            history = cur.fetchall()
            for row in history:
                tasks = json.loads(row['program_data'])
                for t in tasks:
                    if t.get('completed') is True or t.get('completed') == 1:
                        total_tasks += 1
                        d_str = str(t.get('duration', '0')).lower()
                        if 'saat' in d_str: total_minutes += 60
                        else:
                            try:
                                num = int(''.join(filter(str.isdigit, d_str)))
                                total_minutes += num
                            except: total_minutes += 45

            # Aktif programdan hesaplama
            cur.execute('SELECT duration FROM program WHERE user_id = %s AND completed = TRUE', (user_id,))
            active = cur.fetchall()
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
        finally:
            conn.close()

    # --- 5. ANALİZ VE AI ROTALARI ---
    @app.route('/generate-program', methods=['POST'])
    def generate_program_route():
        data = request.get_json()
        user_id = data.get('user_id')
        
        # AI Servisi (services.py) veritabanından bağımsız olduğu için aynı kalır
        program = generate_ai_schedule(data.get('goal', 'Hedef'), data.get('hours', 4))
        
        if not program:
            return jsonify({"status": "error", "message": "AI yanıt vermedi"}), 500

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('DELETE FROM program WHERE user_id = %s', (user_id,))
            for p in program:
                cur.execute(
                    'INSERT INTO program (user_id, gun, task, duration, completed, questions) VALUES (%s, %s, %s, %s, %s, %s)',
                    (user_id, p['gun'], p['task'], p['duration'], False, int(p.get('questions', 0)))
                )
            conn.commit()
            return jsonify({"status": "success", "program": program})
        except Exception as e:
            logger.error(f"❌ Program Üretme Hatası: {e}")
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/analizler/<user_id>', methods=['GET'])
    def get_analizler(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT id, lesson_name as ad, net, date as tarih FROM exam_results WHERE user_id = %s ORDER BY id DESC', (user_id,))
            veriler = cur.fetchall()
            return jsonify(veriler)
        except Exception as e:
             return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/analiz-ekle', methods=['POST'])
    def analiz_ekle():
        data = request.get_json()
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute('INSERT INTO exam_results (user_id, lesson_name, net, date) VALUES (%s, %s, %s, CURRENT_TIMESTAMP)',
                        (data.get('user_id'), data['ad'], data['net']))
            conn.commit()
            return jsonify({"status": "success"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
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
        except Exception as e:
            conn.rollback()
            return jsonify({"status": "error", "message": str(e)}), 500
        finally:
            conn.close()

    @app.route('/ai-yorumla/<user_id>', methods=['GET'])
    def ai_yorumla(user_id):
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT lesson_name as deneme_ad, net FROM exam_results WHERE user_id = %s ORDER BY id DESC LIMIT 5', (user_id,))
            veriler = cur.fetchall()
            
            if not veriler: 
                return jsonify({"yorum": "Veri yok."})
            
            summary = ", ".join([f"{r['deneme_ad']}: {r['net']} net" for r in veriler])
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "system", "content": f"Öğrenci koçu olarak bu netleri yorumla: {summary}"}]
            )
            return jsonify({"yorum": completion.choices[0].message.content})
        except Exception as e:
            return jsonify({"yorum": "Analiz şu an yapılamıyor.", "error": str(e)})
        finally:
            conn.close()