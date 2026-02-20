from firebase_db import initialize_firebase, get_firestore
from firebase_admin import storage
import os

try:
    initialize_firebase()
    bucket = storage.bucket() # Get default bucket
    print(f"Default Bucket Name: {bucket.name}")
    
    # Try with hardcoded bucket
    hardcoded_bucket = storage.bucket("rcsinavim.appspot.com")
    print(f"Hardcoded Bucket Name: {hardcoded_bucket.name}")
    
    # Try to list blobs (checking connectivity)
    # limit to 1
    blobs = list(bucket.list_blobs(max_results=1))
    print(f"Successfully listed {len(blobs)} blobs in default bucket.")
    
except Exception as e:
    print(f"FIREBASE STORAGE ERROR: {e}")
