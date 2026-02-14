
import sys
import os

# Add the parent directory to sys.path to allow importing from backend modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from firebase_admin import firestore
from firebase_db import initialize_firebase, get_firestore

def cleanup_old_schema():
    print("Firebase başlatılıyor...")
    initialize_firebase()
    db = get_firestore()
    
    # 1. Eski ana koleksiyonu belirle
    old_collection_ref = db.collection("exam_results")
    
    # 2. Verileri sil (Batch silme işlemi)
    print("Eski veriler aranıyor...")
    docs = old_collection_ref.list_documents(page_size=500)
    deleted_count = 0
    
    batch = db.batch()
    for doc in docs:
        batch.delete(doc)
        deleted_count += 1
        
        if deleted_count % 500 == 0:
            batch.commit()
            print(f"{deleted_count} adet veri silindi...")
            batch = db.batch()
            
    # Kalanları sil
    if deleted_count % 500 != 0:
        batch.commit()
    
    print(f"Temizlik Tamamlandı: {deleted_count} adet eski analiz verisi silindi.")

if __name__ == "__main__":
    cleanup_old_schema()
