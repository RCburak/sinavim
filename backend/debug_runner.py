import sys
try:
    import main
    print("Main imported successfully")
except Exception:
    import traceback
    traceback.print_exc()
