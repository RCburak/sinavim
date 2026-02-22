# RC Sınavım Backend — Proje Yapısı (Firestore)

Modüler FastAPI Router yapısı; veritabanı: Firebase Firestore.

## Klasör Yapısı

```
backend/
├── main.py                # Ana uygulama (FastAPI entry point, uvicorn)
├── config.py              # Konfigürasyon (env)
├── errors.py              # Özel istisnalar ve hata işleyicileri
├── schemas.py             # Pydantic doğrulama şemaları
├── firebase_db.py         # Firebase Admin SDK başlatma, Firestore bağlantısı
├── routes/                # APIRouter rotaları
│   ├── auth.py            # Kimlik doğrulama
│   ├── program.py         # Ders programı CRUD
│   ├── analiz.py          # Yapay zeka analiz
│   ├── teacher.py         # Öğretmen işlemleri
│   ├── institution.py     # Kurum işlemleri
│   ├── questions.py       # Soru havuzu
│   └── admin.py           # Admin paneli
├── services/              # Firestore CRUD (NoSQL)
│   ├── user_service.py    # Kullanıcı işlemleri
│   ├── program_service.py # Program CRUD
│   ├── analiz_service.py  # Analiz işlemleri
│   ├── teacher_service.py # Öğretmen CRUD
│   ├── question_service.py# Soru havuzu CRUD
│   └── admin_service.py   # Admin işlemleri
├── utils/
│   ├── responses.py       # Standart API yanıt formatları
│   └── validators.py      # Girdi doğrulama yardımcıları
├── templates/             # HTML şablonları
│   ├── admin_panel.html   # Admin paneli arayüzü
│   └── teacher_register.html # Öğretmen kayıt formu
├── scripts/
│   └── cleanup_exam_results.py
├── FIREBASE_SETUP.md      # Service Account ve .env açıklaması
└── .env.example
```

## Ortam Değişkenleri

- `GOOGLE_APPLICATION_CREDENTIALS` veya `FIREBASE_SERVICE_ACCOUNT_PATH`: Service Account JSON dosya yolu
- `GROQ_API_KEY`: Groq AI API anahtarı
- `FLASK_ENV`: development | production
- `SECRET_KEY`: Üretimde mutlaka ayarlanmalı

## Çalıştırma

```bash
# Geliştirme modu
python main.py
# veya
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
