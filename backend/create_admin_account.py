"""
Kurum sahibi (Admin) hesabı oluşturma scripti.
Kullanım: python create_admin_account.py

Not: Bu script `institutions` koleksiyonuna yeni bir kurum sahibi kaydı ekler.
Kurum sahibi, admin paneline giriş yaparak kendi öğretmenlerini yönetebilir.
"""
import logging
from firebase_admin import firestore
from firebase_db import initialize_firebase, get_firestore

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_admin_account():
    print("\n--- RC Sınavım: Kurum Sahibi (Admin) Kaydı ---")
    print("Bu script Firestore 'institutions' koleksiyonuna yeni bir kurum sahibi kaydı ekler.\n")

    name = input("Kurum / Kurum Sahibi Adı: ").strip()
    email = input("Giriş E-postası: ").strip()
    password = input("Giriş Şifresi: ").strip()
    invite_code = input("Davet Kodu (öğrenciler için): ").strip()

    if not all([name, email, password, invite_code]):
        print("\n❌ Hata: Tüm alanlar zorunludur!")
        return

    try:
        initialize_firebase()
        db = get_firestore()

        # E-posta kontrolü
        existing = db.collection("institutions").where("email", "==", email).limit(1).get()
        if existing:
            print(f"\n❌ Hata: Bu e-posta ({email}) zaten kullanımda!")
            return

        # Davet kodu kontrolü
        existing_code = db.collection("institutions").where("invite_code", "==", invite_code).limit(1).get()
        if existing_code:
            print(f"\n❌ Hata: Bu davet kodu ({invite_code}) zaten kullanımda!")
            return

        # Kayıt oluşturma
        ref = db.collection("institutions").document()
        ref.set({
            "name": name,
            "email": email,
            "password": password,
            "invite_code": invite_code,
            "is_registered": True,
            "created_at": firestore.SERVER_TIMESTAMP,
        })

        print(f"\n✅ Kurum sahibi hesabı başarıyla oluşturuldu!")
        print(f"ID: {ref.id}")
        print(f"Ad: {name}")
        print(f"E-posta: {email}")
        print(f"Davet Kodu: {invite_code}")
        print(f"\nAdmin paneline erişim: http://localhost:8000/admin/panel")

    except Exception as e:
        logger.error(f"Bir hata oluştu: {e}")


if __name__ == "__main__":
    create_admin_account()
