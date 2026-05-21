from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: Optional[str] = None
    subscription: str = "free"
    avatar_url: Optional[str] = None
    theme: Optional[str] = "dark"
    resume_skills: List[str] = []
    total_sessions: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    resume_skills: Optional[List[str]] = None
    theme: Optional[str] = None
