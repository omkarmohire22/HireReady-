from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AnswerSubmit(BaseModel):
    session_id: str
    question_id: str
    answer_text: Optional[str] = None
    # For audio uploads, we will use Form data instead of JSON payload

class AnswerResponse(BaseModel):
    id: str = Field(alias="_id")
    session_id: str
    question_id: str
    question_text: str
    answer_text: str
    score: float
    feedback: str
    strengths: List[str]
    improvements: List[str]
    keywords_used: List[str]
    keywords_missed: List[str]
    filler_word_count: int = 0
    answered_at: datetime

    class Config:
        populate_by_name = True
