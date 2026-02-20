import requests
import json
import time

BASE_URL = "http://localhost:8000"
USER_ID = "fvONBB2Q7VWvYScicu4CLiWXjrI2" # Test User

def print_test_result(name, success, message=""):
    symbol = "✅" if success else "❌"
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

if __name__ == "__main__":
    print("\n--- Kapsamlı API Testi Başlatılıyor ---\n")
    test_add_analiz_success()
    test_add_analiz_invalid_data()
    test_data_lifecycle()
    print("\n--- Test Tamamlandı ---\n")
