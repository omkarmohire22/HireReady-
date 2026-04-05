import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "hireready")

# Initialize MongoDB client
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

# Collection handles to be imported by other modules
users_col     = db["users"]
sessions_col  = db["sessions"]
questions_col = db["questions"]
answers_col   = db["answers"]
reports_col   = db["reports"]
