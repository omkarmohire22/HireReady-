from database.connection import SessionLocal
from database.models import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == "codewarrior224@gmail.com").first()
    if user:
        user.subscription = "pro"
        db.commit()
        print(f"SUCCESS: Upgraded user {user.email} (ID: {user.id}) to Pro subscription!")
    else:
        print("ERROR: User with email codewarrior224@gmail.com not found in database.")
        # Let's list all users to see
        users = db.query(User).all()
        print("Existing users:")
        for u in users:
            print(f"- {u.email} (subscription: {u.subscription})")
finally:
    db.close()
