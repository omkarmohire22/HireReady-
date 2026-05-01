import urllib.request
import json

BASE_URL = "http://localhost:8000/api/auth"

def test_register():
    print("Testing Registration...")
    data = json.dumps({
        "email": "testuser@example.com",
        "name": "Test User",
        "password": "securepassword123"
    }).encode("utf-8")
    
    req = urllib.request.Request(f"{BASE_URL}/register", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("Register Success:", result)
            return True
    except urllib.error.HTTPError as e:
        print(f"Register Failed: {e.code} - {e.read().decode()}")
        # Might already exist, which is fine
        return e.code == 400 and "Email already registered" in e.read().decode()

def test_login():
    print("\nTesting Login...")
    # OAuth2 login requires form data (x-www-form-urlencoded)
    import urllib.parse
    data = urllib.parse.urlencode({
        "username": "testuser@example.com",
        "password": "securepassword123"
    }).encode("utf-8")
    
    req = urllib.request.Request(f"{BASE_URL}/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("Login Success. Token received.")
            return result.get("access_token")
    except urllib.error.HTTPError as e:
        print(f"Login Failed: {e.code} - {e.read().decode()}")
        return None

def test_get_me(token):
    print("\nTesting Get Me...")
    req = urllib.request.Request(f"{BASE_URL}/me", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("Get Me Success:", result)
    except urllib.error.HTTPError as e:
        print(f"Get Me Failed: {e.code} - {e.read().decode()}")

if __name__ == "__main__":
    test_register()
    token = test_login()
    if token:
        test_get_me(token)
