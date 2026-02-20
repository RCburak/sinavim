"""
Firebase (Firestore) veritabanı bağlantısı.
Uygulama başlarken initialize_firebase() çağrılmalıdır.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()

_db = None

logger = logging.getLogger(__name__)


def get_firestore():
    """Firestore istemcisini döndürür. Önce initialize_firebase() çağrılmalı."""
    global _db
    if _db is None:
        raise RuntimeError("Firebase henuz baslatilmadi. initialize_firebase() cagirin.")
    return _db


def initialize_firebase():
    """
    Firebase Admin SDK ve Firestore'u baslatir.
    GOOGLE_APPLICATION_CREDENTIALS veya FIREBASE_SERVICE_ACCOUNT_PATH .env'de olmali.
    """
    global _db
    import firebase_admin
    from firebase_admin import credentials, firestore

    if firebase_admin._apps:
        _db = firestore.client()
        logger.info("Firebase zaten baslatilmis, Firestore baglantisi kullaniliyor.")
        return _db

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH"
    )
    if not cred_path or not os.path.isfile(cred_path):
        raise FileNotFoundError(
            "Firebase Service Account JSON bulunamadi. "
            ".env icinde GOOGLE_APPLICATION_CREDENTIALS veya FIREBASE_SERVICE_ACCOUNT_PATH "
            "dosya yolu ile belirtin."
        )

    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'rcsinavim.appspot.com'
    })
    _db = firestore.client()
    logger.info("Firebase (Firestore) basariyla baslatildi.")
    return _db
