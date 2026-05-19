import sys
try:
    from main import app
    print("Main loaded successfully")
except Exception as e:
    import traceback
    traceback.print_exc()
