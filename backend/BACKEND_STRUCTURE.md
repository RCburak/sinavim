# RC Sınavım Backend - Proje Yapısı (Firestore)

Modüler Flask Blueprint yapısı; veritabanı: Firebase Firestore.

## Klasör Yapısı

```
backend/
├── app.py                 # Ana uygulama fabrikası
├── config.py              # Konfigürasyon (env)
├── errors.py              # Özel istisnalar ve hata işleyicileri
├── firebase_db.py         # Firebase Admin SDK başlatma, Firestore bağlantısı
├── routes/                # Blueprint rotaları
│   ├── auth.py
│   ├── institution.py
│   ├── teacher.py
│   ├── program.py
│   └── analiz.py
├── services/              # Firestore CRUD (NoSQL)
│   ├── user_service.py
│   ├── program_service.py
│   ├── teacher_service.py
│   └── analiz_service.py
├── utils/
│   ├── responses.py
│   └── validators.py
├── services.py            # Groq AI (generate_ai_schedule vb.)
├── FIREBASE_SETUP.md      # Service Account ve .env açıklaması
└── .env.example
```

## Ortam Değişkenleri

- `GOOGLE_APPLICATION_CREDENTIALS` veya `FIREBASE_SERVICE_ACCOUNT_PATH`: Service Account JSON dosya yolu
- `GROQ_API_KEY`: Groq AI API anahtarı
- `FLASK_ENV`: development | production
- `SECRET_KEY`: Üretimde mutlaka ayarlanmalı
