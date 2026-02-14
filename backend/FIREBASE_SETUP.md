# Firebase (Firestore) Kurulumu

## 1. Service Account JSON dosyası

1. [Firebase Console](https://console.firebase.google.com/) → Projeni seç → **Proje ayarları** (dişli) → **Hizmet hesapları** sekmesi.
2. **Yeni özel anahtar oluştur** ile JSON indir.
3. Bu dosyayı **proje dışında** veya **backend klasörü içinde** güvenli bir yere koy (versiyonlamaya ekleme).

**Önerilen konum (bir seçenek):**

- `backend/serviceAccountKey.json`  
  → `.gitignore` içine `serviceAccountKey.json` ve `*.json` (credentials) ekleyin ki repoya girmesin.

**Alternatif:** İstersen farklı bir dizine (örn. `C:/keys/sinavim-firebase.json`) koyup .env'de tam yolu verin.

## 2. .env ayarı

`backend/.env` dosyasında aşağıdakilerden birini kullan:

**Seçenek A – Mutlak yol (Windows):**
```env
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/serviceAccountKey.json
```

**Seçenek B – Backend klasörüne koyduysan (proje içi):**
```env
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
```
(Backend’i `python app.py` ile `backend` klasöründen çalıştırıyorsan bu yeterli.)

**Seçenek C – Aynı anlama gelen alternatif değişken:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
```

## 3. .gitignore

`backend/.gitignore` veya proje kökündeki `.gitignore` içinde mutlaka şunlar olsun:

```
serviceAccountKey.json
*.json
.env
```

(İhtiyaca göre sadece `serviceAccountKey.json` da yeterli.)

## 4. Firestore koleksiyonları

Backend aşağıdaki koleksiyonları kullanır. İlk yazmada otomatik oluşur; elle oluşturmana gerek yok.

| Koleksiyon           | Açıklama                          |
|----------------------|------------------------------------|
| `users`              | Öğrenci/kullanıcı (doc id = Firebase Auth uid) |
| `institutions`       | Kurumlar / öğretmen girişi         |
| `programs`           | Aktif haftalık program (doc id = user_id) |
| `program_history`    | Arşivlenmiş programlar            |
| `exam_results`       | Deneme analizleri (net vs.)       |

## 5. İlk öğretmen/kurum kaydı

Öğretmen paneli ile giriş yapabilmek için Firestore’da en az bir `institutions` dokümanı olmalı. İki yol:

- **Firebase Console:** Firestore → **institutions** koleksiyonunu oluştur → **Belge ekle** → Örnek alanlar:  
  `name` (string), `email` (string), `password` (string), `invite_code` (string), `created_at` (timestamp), `is_active` (boolean).
- **Kod:** İstersen `backend/scripts/create_demo_institution.py` gibi tek seferlik bir script ile de ekleyebilirsin.

Bu adımlardan sonra backend’i çalıştırıp API’yi test edebilirsin.
