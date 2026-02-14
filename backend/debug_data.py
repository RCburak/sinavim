"""Firestore veri kontrolü - sonuçları dosyaya yazar."""
from firebase_db import initialize_firebase, get_firestore

initialize_firebase()
db = get_firestore()

with open("debug_output.txt", "w", encoding="utf-8") as f:
    f.write("=== INSTITUTIONS ===\n")
    for doc in db.collection("institutions").get():
        d = doc.to_dict()
        f.write(f"  ID: {doc.id}\n")
        f.write(f"  name: {d.get('name')}\n")
        f.write(f"  email: {d.get('email')}\n")
        f.write(f"  invite_code: {d.get('invite_code')}\n\n")

    f.write("=== USERS ===\n")
    for doc in db.collection("users").get():
        d = doc.to_dict()
        iid = d.get("institution_id")
        f.write(f"  ID: {doc.id} | name: {d.get('name')} | email: {d.get('email')} | institution_id: {iid}\n")

print("Done - see debug_output.txt")
