# RC Sınavım — Frontend (Mobil Uygulama)

React Native (Expo) ile geliştirilmiş öğrenci ve öğretmen mobil uygulaması.

## 🛠️ Teknolojiler

- **Framework**: React Native (Expo SDK)
- **Dil**: TypeScript
- **Navigasyon**: Expo Router (dosya tabanlı yönlendirme)
- **State Yönetimi**: React Context API
- **Backend İletişimi**: REST API (`src/config/api.ts`)

## 📂 Klasör Yapısı

```
frontend/
├── app/                    # Sayfa rotaları (Expo Router)
│   ├── _layout.tsx         # Kök layout, Context Provider'lar
│   ├── index.tsx           # Giriş noktası (auth yönlendirme)
│   ├── login.tsx           # Öğrenci giriş
│   ├── register.tsx        # Öğrenci kayıt
│   ├── dashboard.tsx       # Dashboard ekranı
│   ├── ProfileView.tsx     # Profil ekranı
│   ├── HistoryView.tsx     # Geçmiş ekranı
│   ├── QuestionPoolView.tsx # Soru havuzu
│   ├── SplashScreen.tsx    # Açılış ekranı
│   ├── teacher/            # Öğretmen paneli
│   └── admin/              # Admin paneli
├── src/
│   ├── config/             # API URL ve headers
│   ├── constants/          # Tema sabitleri
│   ├── contexts/           # AuthContext, ThemeContext, ScheduleContext
│   ├── hooks/              # Custom hooks (useProfile, usePomodoro, useAnaliz)
│   ├── services/           # API servisleri
│   ├── components/         # Yeniden kullanılabilir bileşenler
│   ├── types/              # TypeScript tip tanımları
│   └── lib/                # Yardımcı kütüphaneler
└── assets/                 # Görseller ve fontlar
```

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
# EXPO_PUBLIC_API_URL=http://localhost:5000

# Uygulamayı başlat
npx expo start
```

QR kodu mobil cihazınızla taratın veya emülatörde çalıştırın.
