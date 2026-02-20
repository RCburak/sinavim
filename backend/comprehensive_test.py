import requests
import json
import time

BASE_URL = "http://localhost:8000"
USER_ID = "fvONBB2Q7VWvYScicu4CLiWXjrI2" # Test User

def print_test_result(name, success, message=""):
    symbol = "[SUCCESS]" if success else "[FAILURE]"
    print(f"{symbol} {name}: {message}")

def test_add_analiz_success():
    name = "Test: Analiz Ekleme (Success)"
    payload = {
        "user_id": USER_ID,
        "ad": "Test Denemesi",
        "net": 75.5,
        "type": "TYT",
        "date": "2024-02-20"
    }
    try:
        resp = requests.post(f"{BASE_URL}/analiz-ekle", json=payload)
        if resp.status_code == 201:
            print_test_result(name, True)
            return True
        else:
            print_test_result(name, False, f"Status: {resp.status_code}, Body: {resp.text}")
            return False
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_add_analiz_invalid_data():
    name = "Test: Analiz Ekleme (Hatalı Veri - Negatif Net)"
    payload = {
        "user_id": USER_ID,
        "ad": "Hatalı Deneme",
        "net": -5.0, # Bu backend'de pydantic ile yakalanabilir veya servis katmanında
        "type": "TYT"
    }
    try:
        resp = requests.post(f"{BASE_URL}/analiz-ekle", json=payload)
        # Eğer backend'de validator varsa 422 döner, yoksa 201 dönerse testi geçemez (negatif net yasak olmalı)
        if resp.status_code in [400, 422]:
            print_test_result(name, True, f"Beklenen hata alındı: {resp.status_code}")
            return True
        else:
            print_test_result(name, False, f"Hata bekleniyordu ama {resp.status_code} alındı.")
            return False
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_data_lifecycle():
    name = "Test: Veri Yaşam Döngüsü (Ekle -> Listele -> Sil)"
    unique_ad = f"Lifecycle Test {int(time.time())}"
    
    # 1. Ekle
    add_payload = {
        "user_id": USER_ID,
        "ad": unique_ad,
        "net": 50.0,
        "type": "TYT"
    }
    try:
        add_resp = requests.post(f"{BASE_URL}/analiz-ekle", json=add_payload)
        if add_resp.status_code != 201:
            print_test_result(name, False, "Ekleme başarısız")
            return False
        
        # 2. Listele ve ID bul
        list_resp = requests.get(f"{BASE_URL}/analizler/{USER_ID}")
        analizler = list_resp.json()
        target_id = None
        for item in analizler:
            if item.get('ad') == unique_ad:
                target_id = item.get('id')
                break
        
        if not target_id:
            print_test_result(name, False, "Eklenen veri listede bulunamadı")
            return False
        
        # 3. Sil
        del_resp = requests.delete(f"{BASE_URL}/analiz-sil/{target_id}?user_id={USER_ID}")
        if del_resp.status_code == 200:
            print_test_result(name, True, f"ID {target_id} başarıyla silindi.")
            return True
        else:
            print_test_result(name, False, f"Silme başarısız: {del_resp.status_code}")
            return False
            
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_auth_and_profile():
    name = "Test: Auth ve Profil (Sync & Update)"
    sync_payload = {
        "uid": USER_ID,
        "email": "test@example.com",
        "name": "Test User Updated"
    }
    try:
        # 1. Sync User
        sync_resp = requests.post(f"{BASE_URL}/sync-user", json=sync_payload)
        if sync_resp.status_code not in [200, 201]:
            print_test_result(name, False, f"Sync hatası: {sync_resp.status_code}")
            return False
            
        # 2. Update Profile
        update_payload = {
            "user_id": USER_ID,
            "name": "New Name"
        }
        update_resp = requests.post(f"{BASE_URL}/update-profile", json=update_payload)
        if update_resp.status_code != 200:
            print_test_result(name, False, f"Profil güncelleme hatası: {update_resp.status_code}")
            return False
            
        print_test_result(name, True)
        return True
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_program_lifecycle():
    name = "Test: Program Döngüsü (Kaydet -> Getir -> Arşivle)"
    program_payload = {
        "user_id": USER_ID,
        "program": [
            {"day": "Pazartesi", "lesson": "Matematik", "questions": 50, "completed": False}
        ]
    }
    try:
        # 1. Kaydet
        save_resp = requests.post(f"{BASE_URL}/save-program", json=program_payload)
        if save_resp.status_code != 200:
            print_test_result(name, False, f"Program kaydetme hatası: {save_resp.status_code}")
            return False
            
        # 2. Getir
        get_resp = requests.get(f"{BASE_URL}/get-program/{USER_ID}")
        if get_resp.status_code != 200 or len(get_resp.json()) == 0:
            print_test_result(name, False, "Program listelenemedi")
            return False
            
        # 3. Arşivle
        archive_payload = {"user_id": USER_ID, "type": "manual"}
        archive_resp = requests.post(f"{BASE_URL}/archive-program", json=archive_payload)
        if archive_resp.status_code != 200:
            print_test_result(name, False, f"Arşivleme hatası: {archive_resp.status_code}")
            return False
            
        print_test_result(name, True)
        return True
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_institution_and_stats():
    name = "Test: Kurum ve İstatistikler (Join & Stats)"
    try:
        # 1. User Stats (Başlangıç)
        stats_resp = requests.get(f"{BASE_URL}/user-stats/{USER_ID}")
        if stats_resp.status_code != 200:
            print_test_result(name, False, "Stats çekilemedi")
            return False
            
        # 2. Kuruma Katıl (Hatalı Kod ile)
        join_payload = {"code": "INVALID_CODE", "user_id": USER_ID}
        join_resp = requests.post(f"{BASE_URL}/join-institution", json=join_payload)
        if join_resp.status_code == 200: # Backend geçersiz kodda hata vermeli (404/400)
            data = join_resp.json()
            if data.get('status') == 'error':
                 pass # Beklenen durum
            else:
                print_test_result(name, False, "Geçersiz kod kabul edildi!")
                return False
                
        print_test_result(name, True, "Stats ve Join (Hata Kontrolü) başarılı")
        return True
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_question_lifecycle():
    name = "Test: Soru Döngüsü (Ekle -> Güncelle -> Sil)"
    try:
        # 1. Soru Ekle (Multipart Form)
        with open("test_image.png", "rb") as f:
            files = {"image": ("test_image.png", f, "image/png")}
            data = {
                "user_id": USER_ID,
                "lesson": "Test Dersi",
                "topic": "Test Konusu",
                "notes": "Test Notu"
            }
            add_resp = requests.post(f"{BASE_URL}/questions/add", files=files, data=data)
        
        if add_resp.status_code != 201:
            print_test_result(name, False, f"Soru ekleme hatası: {add_resp.status_code}")
            return False
            
        added_question = add_resp.json().get('data', {})
        q_id = added_question.get('id')
        if not q_id:
            # Bazı durumlarda dönen JSON yapısı farklı olabilir
            list_resp = requests.get(f"{BASE_URL}/questions/{USER_ID}")
            q_id = list_resp.json()[0].get('id')

        # 2. Durum Güncelle (PUT)
        update_payload = {"user_id": USER_ID, "solved": True}
        update_resp = requests.put(f"{BASE_URL}/questions/{q_id}/status", json=update_payload)
        if update_resp.status_code != 200:
            print_test_result(name, False, f"Durum güncelleme hatası: {update_resp.status_code}")
            return False
            
        # 3. Sil (DELETE)
        del_resp = requests.delete(f"{BASE_URL}/questions/{q_id}?user_id={USER_ID}")
        if del_resp.status_code != 200:
            print_test_result(name, False, f"Silme hatası: {del_resp.status_code}")
            return False
            
        print_test_result(name, True, "Ekle -> Güncelle -> Sil döngüsü başarılı.")
        return True
            
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

def test_admin_teacher_connectivity():
    name = "Test: Admin/Teacher Bağlantısı (Health Check)"
    try:
        # 1. Admin Panel
        admin_resp = requests.get(f"{BASE_URL}/admin/panel")
        if admin_resp.status_code == 200:
            print_test_result(name, True)
            return True
        else:
            print_test_result(name, False, f"Admin: {admin_resp.status_code}")
            return False
    except Exception as e:
        print_test_result(name, False, str(e))
        return False

if __name__ == "__main__":
    print("\n--- Kapsamlı Tüm Sistem Testi Başlatılıyor ---\n")
    
    # Analiz
    test_add_analiz_success()
    test_add_analiz_invalid_data()
    test_data_lifecycle()
    
    # Auth & Profil
    test_auth_and_profile()
    
    # Program
    test_program_lifecycle()
    
    # Kurum & İstatistik
    test_institution_and_stats()
    
    # Sorular (Düzeltildi)
    test_question_lifecycle()
    
    # Yönetim
    test_admin_teacher_connectivity()
    
    print("\n--- Tüm Testler Tamamlandı ---\n")
