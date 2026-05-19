import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hireready.db")
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE answers ADD COLUMN communication_metrics JSON DEFAULT '{}'"))
        print("Successfully added communication_metrics column to answers table")
except Exception as e:
    print(f"Error: {e}")
