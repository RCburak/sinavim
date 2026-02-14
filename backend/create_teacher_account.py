"""
Öğretmen (Kurum) hesabı oluşturma scripti.
Kullanım: python create_teacher_account.py
"""
import logging
from firebase_admin import firestore
from firebase_db import initialize_firebase, get_firestore

# Loglama ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_teacher_account():
    print("\n--- RC Sınavım: Öğretmen/Kurum Kaydı ---")
    print("Bu script Firestore 'institutions' koleksiyonuna yeni bir kayıt ekler.\n")

    name = input("Kurum/Öğretmen Adı: ").strip()
    email = input("Giriş E-postası: ").strip()
    password = input("Giriş Şifresi: ").strip()
    invite_code = input("Öğrenci Davet Kodu (Benzersiz olmalı): ").strip()

    if not all([name, email, password, invite_code]):
        print("\n❌ Hata: Tüm alanlar zorunludur!")
        return

    try:
        initialize_firebase()
        db = get_firestore()

        # E-posta kontrolü
        existing_email = db.collection("institutions").where("email", "==", email).limit(1).get()
        if existing_email:
            print(f"\n❌ Hata: Bu e-posta ({email}) zaten kullanımda!")
            return

        # Davet kodu kontrolü
        existing_code = db.collection("institutions").where("invite_code", "==", invite_code).limit(1).get()
        if existing_code:
            print(f"\n❌ Hata: Bu davet kodu ({invite_code}) zaten kullanımda!")
            return

        # Kayıt oluşturma
        new_doc_ref = db.collection("institutions").document()
        new_doc_ref.set({
            "name": name,
            "email": email,
            "password": password,
            "invite_code": invite_code,
            "created_at": firestore.SERVER_TIMESTAMP
        })

        print(f"\n✅ Başarıyla oluşturuldu!")
        print(f"ID: {new_doc_ref.id}")
        print(f"E-posta: {email}")
        print(f"Şifre: {password}")
        print(f"Davet Kodu: {invite_code}")

    except Exception as e:
        logger.error(f"Bir hata oluştu: {e}")

if __name__ == "__main__":
    create_teacher_account()
