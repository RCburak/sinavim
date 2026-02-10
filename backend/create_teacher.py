# backend/create_teacher.py
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def create_demo_teacher():
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Test Öğretmeni Oluşturuyoruz
        cur.execute("""
            INSERT INTO institutions (name, email, password, invite_code)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, invite_code;
        """, ("Burak Hoca Akademi", "burak@hocam.com", "123456", "RC-TEST"))
        
        teacher = cur.fetchone()
        conn.commit()
        
        print(f"✅ Öğretmen Oluşturuldu: {teacher[1]}")
        print(f"🔑 Giriş Kodu: {teacher[2]} (Bunu uygulamada gir)")
        print(f"📧 Web Panel Girişi: burak@hocam.com / 123456")
        
        cur.close()
        conn.close()
    except Exception as e:
        print("Hata:", e)

if __name__ == "__main__":
    create_demo_teacher()