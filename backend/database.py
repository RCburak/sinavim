import sqlite3
import os

# Veritabanı dosyasının backend klasöründe olmasını sağlıyoruz
DB_PATH = os.path.join(os.path.dirname(__file__), 'sinavim.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    # Verilerin sözlük (dict) gibi gelmesini sağlar: row['net'] gibi
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Tabloları ilk kez oluşturur."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Deneme Analizleri Tablosu
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analizler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deneme_ad TEXT NOT NULL,
            net REAL NOT NULL,
            tarih TEXT NOT NULL
        )
    ''')
    
    # (Opsiyonel) Programı da burada saklayabiliriz
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS program (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gun TEXT NOT NULL,
            ders TEXT NOT NULL,
            konu TEXT NOT NULL,
            sure TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Veritabanı hazır ve tablolar oluşturuldu!")