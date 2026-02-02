import sqlite3
import os
from contextlib import contextmanager

# Veritabanı dosyasının backend klasöründe olmasını sağlıyoruz
DB_PATH = os.path.join(os.path.dirname(__file__), 'sinavim.db')

@contextmanager
def get_db_connection():
    """
    Veritabanı bağlantısını güvenli bir şekilde yönetir.
    'with' bloğu bittiğinde bağlantıyı otomatik kapatır.
    """
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
        
        # Deneme Analizleri Tablosu
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analizler (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deneme_ad TEXT NOT NULL,
                net REAL NOT NULL,
                tarih TEXT NOT NULL,
                notlar TEXT -- İleride AI notları için ekledim
            )
        ''')
        
        # Haftalık Program Tablosu
        # 'completed' sütununu ekledim, frontend ile tam uyumlu olsun.
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS program (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gun TEXT NOT NULL,
                task TEXT NOT NULL,
                duration TEXT NOT NULL,
                completed INTEGER DEFAULT 0
            )
        ''')
        
        conn.commit()
    print("✅ Veritabanı mimarisi güncellendi ve tablolar hazır!")

if __name__ == "__main__":
    init_db()