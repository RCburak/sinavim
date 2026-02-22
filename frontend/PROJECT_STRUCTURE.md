# RC Sınavım - Proje Yapısı

Bu doküman projenin profesyonel klasör yapısını ve bileşen dağılımını açıklar.

## Klasör Yapısı

```
frontend/
├── app/                    # Sayfa rotaları (Expo Router)
│   ├── _layout.tsx         # Kök layout, Context Provider'lar
│   ├── index.tsx           # Ana giriş noktası (auth + view yönlendirme)
│   ├── login.tsx           # Öğrenci giriş
│   ├── register.tsx        # Öğrenci kayıt
│   ├── dashboard.tsx       # Dashboard ekranı bileşeni
│   ├── ProfileView.tsx     # Profil ekranı
│   ├── HistoryView.tsx     # Geçmiş ekranı
│   └── teacher/            # Öğretmen paneli (ayrı rota grubu)
│       ├── login.tsx
│       ├── dashboard.tsx
│       └── assignments.tsx
├── src/
│   ├── config/             # Konfigürasyon
│   │   └── api.ts          # API URL ve headers (merkezi)
│   ├── constants/
│   │   └── theme.ts        # Renkler, tema sabitleri
│   ├── contexts/           # React Context'ler
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ScheduleContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useProfile.ts
│   │   ├── usePomodoro.ts
│   │   └── useAnaliz.ts
│   ├── services/           # API servisleri
│   │   ├── authService.ts
│   │   ├── firebaseConfig.ts
│   │   ├── programService.ts
│   │   ├── analizService.ts
│   │   └── taskService.ts
│   └── components/         # Yeniden kullanılabilir bileşenler
│       ├── ProgramView.tsx
│       ├── AnalizView.tsx
│       ├── PomodoroView.tsx
│       ├── ScheduleCard.tsx
│       ├── DayFolder.tsx
│       ├── Dashboard/
│       │   ├── MenuCard.tsx
│       │   └── Header.tsx
│       └── profile/
│           ├── ProfileModals.tsx
│           └── TeacherJoinModal.tsx
└── assets/
```

## Sayfa Akışı

### Öğrenci Akışı
1. **index.tsx** → Auth durumuna göre: Giriş/Kayıt veya Ana Uygulama
2. Ana uygulama `view` state ile sayfa değiştirir: dashboard, program, pomodoro, analiz, history, profile, manual_setup

### Öğretmen Akışı
1. `/teacher/login` → Giriş
2. `/teacher/dashboard` → Öğrenci listesi
3. `/teacher/assignments` → Ödev atama

## Context Kullanımı

- **AuthContext**: Kullanıcı, yükleme durumu, çıkış
- **ThemeContext**: Karanlık mod, tema renkleri
- **ScheduleContext**: Program verisi, CRUD işlemleri

## API Konfigürasyonu

Tüm API çağrıları `src/config/api.ts` dosyasındaki `API_URL` ve `API_HEADERS` kullanmalıdır. Ortam değişkeni: `EXPO_PUBLIC_API_URL`
