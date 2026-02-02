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
    """Tabloları profesyonel standartlarda oluşturur."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. KULLANICILAR TABLOSU (Yeni eklendi)
        # Şifreleri ileride hashleyerek saklamak en doğrusudur.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. DENEME ANALİZLERİ TABLOSU
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analizler (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER, -- Hangi kullanıcıya ait olduğunu belirlemek için
                deneme_ad TEXT NOT NULL,
                net REAL NOT NULL,
                tarih TEXT NOT NULL,
                notlar TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # 3. HAFTALIK PROGRAM TABLOSU
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS program (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                gun TEXT NOT NULL,
                task TEXT NOT NULL,
                duration TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
    print("✅ Veritabanı mimarisi (Kullanıcılar dahil) güncellendi!")

if __name__ == "__main__":
    init_db()