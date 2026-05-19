from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    target_role: str
    session_type: str = "role_based"
    difficulty: str = "Medium"

class SessionResponse(BaseModel):
    id: int
    user_id: int
    session_type: str
    target_role: str
    target_skills: List[str] = []
    missing_skills: List[str] = []
    difficulty: str
    status: str
    created_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    questions_answered: int = 0

    class Config:
        from_attributes = True
