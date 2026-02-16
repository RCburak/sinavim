import sys
import traceback
import os
from dotenv import load_dotenv

try:
    load_dotenv()
    print("Environment variables loaded")
    import firebase_db
    print("firebase_db imported")
    firebase_db.initialize_firebase()
    print("Firebase initialized successfully")
except Exception:
    with open("debug_error.log", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
    print("Error occurred, check debug_error.log")
    sys.exit(1)
