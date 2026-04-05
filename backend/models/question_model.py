from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class QuestionResponse(BaseModel):
    id: str = Field(alias="_id")
    role: str
    skill: str
    difficulty: str
    question_type: str
    question_text: str
    source: str
    approved: bool
    tags: List[str] = []

    class Config:
        populate_by_name = True
