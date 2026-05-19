import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User as UserModel
from models.user_model import UserResponse

# Load from .env, with fallbacks
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_dev_key_change_in_production!")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class AuthService:
    @staticmethod
    def verify_password(plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password):
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserModel).filter(UserModel.id == int(user_id)).first()
        
    if user is None:
        raise credentials_exception

    # Dynamic auto-scrub of noise terms from resume skills directory
    if user.resume_skills:
        NOISE_SKILLS = [
            "university", "institute", "college", "school", "board", 
            "certificate", "secondary", "state", "pvt", "ltd", "inc", 
            "simulation", "completed", "projects", "fitmate", "whatsapp",
            "microsoft", "deloitte", "devfolio", "agrohub", "dubssc", "vidyapeeth",
            "mumbai", "dapoli", "ratnagiri", "linkedin", "ssc", "hsc",
            "certifications", "job", "mca", "copilot", "github copilot",
            "resume", "curriculum", "vitae", "work", "experience", "education",
            "personal", "contact", "address", "phone", "email", "hobby", "hobbies",
            "candidate", "evaluator", "interviewer", "company", "client", "pune",
            "maharashtra", "india", "country", "city", "town", "district", "office", "powerpoint", "excel"
        ]
        cleaned = []
        changed = False
        for skill in user.resume_skills:
            skill_lower = skill.lower()
            if any(noise in skill_lower for noise in NOISE_SKILLS):
                changed = True
                continue
            if len(skill) < 2 or len(skill) > 25:
                changed = True
                continue
            cleaned.append(skill)
        
        if changed:
            user.resume_skills = cleaned
            db.commit()
            db.refresh(user)
        
    return user
