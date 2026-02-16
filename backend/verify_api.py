import requests
import json
import os

BASE_URL = "http://localhost:8000"
USER_ID = "fvONBB2Q7VWvYScicu4CLiWXjrI2" # From logs
LOG_FILE = "verify_results.txt"

def log(msg):
    print(msg)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")

if os.path.exists(LOG_FILE):
    os.remove(LOG_FILE)

def test_root():
    log("Testing Root...")
    try:
        resp = requests.get(f"{BASE_URL}/")
        log(f"{resp.status_code} {resp.json()}")
    except Exception as e:
        log(f"Root failed: {e}")

def test_questions():
    log("\nTesting Questions...")
    try:
        resp = requests.get(f"{BASE_URL}/questions/{USER_ID}")
        log(f"GET /questions/{USER_ID}: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            # Handle potential variations in response structure
            if isinstance(data, dict):
                questions = data.get('data', {}).get('questions', []) or data.get('questions', [])
                log(f"Questions count: {len(questions)}")
            else:
                log(f"Unexpected response format: {type(data)}")
    except Exception as e:
        log(f"Questions failed: {e}")

def test_analiz():
    log("\nTesting Analiz...")
    try:
        resp = requests.get(f"{BASE_URL}/analizler/{USER_ID}")
        log(f"GET /analizler/{USER_ID}: {resp.status_code}")
        
        resp_ai = requests.get(f"{BASE_URL}/ai-yorumla/{USER_ID}")
        log(f"GET /ai-yorumla/{USER_ID}: {resp_ai.status_code}")
    except Exception as e:
        log(f"Analiz failed: {e}")

def test_program():
    log("\nTesting Program...")
    try:
        resp = requests.get(f"{BASE_URL}/get-program/{USER_ID}")
        log(f"GET /get-program/{USER_ID}: {resp.status_code}")
    except Exception as e:
        log(f"Program failed: {e}")

def test_user_stats():
    log("\nTesting User Stats...")
    try:
        resp = requests.get(f"{BASE_URL}/user-stats/{USER_ID}")
        log(f"GET /user-stats/{USER_ID}: {resp.status_code}")
    except Exception as e:
        log(f"User Stats failed: {e}")

if __name__ == "__main__":
    test_root()
    test_questions()
    test_analiz()
    test_program()
    test_user_stats()
