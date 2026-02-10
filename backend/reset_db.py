import os
import psycopg2
from dotenv import load_dotenv
from database import init_db # Yeni tablo yapısını buradan çekeceğiz

load_dotenv()

def reset_database():
    confirm = input("⚠️ DİKKAT: Tüm veritabanı tabloları silinecek! Onaylıyor musun? (e/h): ")
    if confirm.lower() != 'e':
        print("İşlem iptal edildi.")
        return

    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        print("🗑️  Eski tablolar siliniyor...")
        # Bağımlılık sırasına göre silme (önce çocuklar, sonra ebeveynler)
        tables = ['tasks', 'program_history', 'program', 'exam_results', 'users', 'institutions']
        for table in tables:
            cur.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
            print(f"   - {table} silindi.")
            
        conn.commit()
        cur.close()
        conn.close()
        
        print("✨ Tablolar yeniden oluşturuluyor...")
        init_db() # database.py içindeki fonksiyonu çağır
        print("✅ Veritabanı başarıyla sıfırlandı ve yeni yapı kuruldu!")
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")

if __name__ == "__main__":
    reset_database()