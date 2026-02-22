# RC Sınavım

**RC Sınavım**, öğrencilerin ders çalışma programlarını yönettiği, Pomodoro tekniği ile çalıştığı ve yapay zeka destekli analizler aldığı kapsamlı bir eğitim platformudur. Öğretmenler de öğrencilerini takip edebilir ve ödev atayabilir.

## 🚀 Özellikler

- **Öğrenci Paneli**:
  - Haftalık ders programı oluşturma ve takibi.
  - Pomodoro sayacı ile odaklanmış çalışma.
  - Yapay zeka destekli gelişim analizi.
  - Test ve deneme sonuçlarını kaydetme.
- **Öğretmen Paneli**:
  - Öğrencilerin çalışma verilerini görüntüleme.
  - Ödev ve görev atama.
  - Sınıf genel durum analizi.

## 🛠️ Teknolojiler

Bu proje iki ana bileşenden oluşur:

### Backend (`/backend`)
- **Dil**: Python 3.x
- **Framework**: FastAPI
- **ASGI Sunucu**: Uvicorn
- **Veritabanı**: Firebase Firestore (NoSQL)
- **Doğrulama**: Pydantic
- **Yapay Zeka**: Groq API
- **Authentication**: Firebase Auth

### Frontend (`/frontend`)
- **Framework**: React Native (Expo)
- **Dil**: TypeScript
- **Navigasyon**: Expo Router
- **State Yönetimi**: React Context API

## 📂 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1. Backend Kurulumu

Terminalde `backend` klasörüne gidin:

```bash
cd backend
```

Sanal ortam oluşturun ve aktif edin:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Gerekli paketleri yükleyin:

```bash
pip install -r requirements.txt
```

`.env` dosyasını oluşturun:
`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değerleri (Firebase Credentials yolu, Groq API Key vb.) doldurun.

Uygulamayı çalıştırın:

```bash
python main.py
```
Sunucu `http://localhost:8000` adresinde çalışacaktır. API dokümantasyonu: `http://localhost:8000/docs`

### 2. Frontend Kurulumu

Yeni bir terminal açın ve `frontend` klasörüne gidin:

```bash
cd frontend
```

Bağımlılıkları yükleyin:

```bash
npm install
```

`.env` dosyasını oluşturun:
Proje kök dizinindeki `.env` dosyasını (örnek varsa) baz alarak API URL'ini ayarlayın:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Uygulamayı başlatın:

```bash
npx expo start
```
QR kodu mobil cihazınızla taratın veya emülatörde (Android/iOS) çalıştırın.

## 📁 Proje Yapısı

```
sinavim/
├── backend/               # FastAPI backend ve servisler
│   ├── routes/            # API uç noktaları (auth, program, analiz, teacher, admin, questions)
│   ├── services/          # İş mantığı ve Firestore CRUD
│   ├── templates/         # HTML şablonları (admin paneli, öğretmen kayıt)
│   ├── utils/             # Yardımcı fonksiyonlar
│   ├── schemas.py         # Doğrulama şemaları
│   └── ...
├── frontend/              # React Native (Expo) mobil uygulama
│   ├── app/               # Ekranlar ve rotalar (Expo Router)
│   ├── src/               # Bileşenler, hook'lar, servisler ve context'ler
│   └── ...
└── README.md              # Proje dokümantasyonu
```

## 🤝 Katkıda Bulunma

1. Bu depoyu forklayın.
2. Yeni bir özellik dalı (branch) oluşturun (`git checkout -b ozellik/yeni-ozellik`).
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`).
4. Dalınızı pushlayın (`git push origin ozellik/yeni-ozellik`).
5. Bir Pull Request oluşturun.
