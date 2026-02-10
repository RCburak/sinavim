import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """PostgreSQL veritabanına bağlanır ve bağlantı nesnesini döndürür."""
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        return conn
    except Exception as e:
        print("❌ Veritabanı bağlantı hatası:", e)
        return None

def init_db():
    """Tabloları TEXT ID uyumlu şekilde oluşturur."""
    conn = get_db_connection()
    if conn is None: return
    
    try:
        cur = conn.cursor()
        
        # Tabloları oluştur (TEXT ID ile)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS institutions (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                invite_code TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, 
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                avatar TEXT,
                institution_id INTEGER REFERENCES institutions(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS exam_results (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                lesson_name TEXT NOT NULL,
                net REAL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS program (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                gun TEXT NOT NULL,
                task TEXT NOT NULL,
                duration TEXT,
                completed BOOLEAN DEFAULT FALSE,
                questions INTEGER DEFAULT 0
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS program_history (
                id SERIAL PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                completion_rate REAL,
                program_data TEXT,
                program_type TEXT DEFAULT 'ai',
                archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                institution_id INTEGER REFERENCES institutions(id),
                student_id TEXT REFERENCES users(id),
                title TEXT NOT NULL,
                description TEXT,
                due_date TIMESTAMP,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Veritabanı tabloları başarıyla oluşturuldu.")
        
    except Exception as e:
        print("❌ Tablo oluşturma hatası:", e)

if __name__ == "__main__":
    init_db()