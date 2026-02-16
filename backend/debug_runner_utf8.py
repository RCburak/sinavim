import sys
import traceback

try:
    import main
    print("Main imported successfully")
except Exception:
    with open("debug_error.log", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
