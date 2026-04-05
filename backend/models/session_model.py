from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    target_role: str
    session_type: str = "role_based"
    difficulty: str = "Medium"

class SessionResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    session_type: str
    target_role: str
    target_skills: List[str] = []
    missing_skills: List[str] = []
    difficulty: str
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_questions: int = 0
    questions_answered: int = 0
    overall_score: float = 0.0
    duration_seconds: int = 0

    class Config:
        populate_by_name = True
