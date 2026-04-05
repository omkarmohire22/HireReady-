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
    id: str = Field(alias="_id")
    email: EmailStr
    name: str
    role: Optional[str] = None
    subscription: str = "free"
    avatar_url: Optional[str] = None
    resume_skills: List[str] = []
    total_sessions: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
