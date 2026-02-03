import sqlite3
import os
from contextlib import contextmanager

# Veritabanı dosyasının yolu
DB_PATH = os.path.join(os.path.dirname(__file__), 'sinavim.db')

@contextmanager
def get_db_connection():
    """Veritabanı bağlantısını context manager ile güvenli yönetir."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Tabloları profesyonel standartlarda oluşturur veya günceller."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. KULLANICILAR TABLOSU
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, 
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. DENEME ANALİZLERİ TABLOSU
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analizler (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT, 
                deneme_ad TEXT NOT NULL,
                net REAL NOT NULL,
                tarih TEXT NOT NULL,
                notlar TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # 3. HAFTALIK PROGRAM TABLOSU (questions sütunu eklendi)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS program (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                gun TEXT NOT NULL,
                task TEXT NOT NULL,
                duration TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                questions INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # EĞER TABLO VARSA VE QUESTIONS SÜTUNU YOKSA EKLE (Migration)
        try:
            cursor.execute('ALTER TABLE program ADD COLUMN questions INTEGER DEFAULT 0')
            print("ℹ️ 'program' tablosuna 'questions' sütunu eklendi.")
        except sqlite3.OperationalError:
            # Sütun zaten varsa hata verir, bunu görmezden geliyoruz
            pass

        # 4. PROGRAM GEÇMİŞİ TABLOSU
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS program_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                archive_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completion_rate REAL, 
                program_data TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
    print("✅ Veritabanı mimarisi ve YKS Soru Takibi altyapısı başarıyla güncellendi!")

if __name__ == "__main__":
    init_db()