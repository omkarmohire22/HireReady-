from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AnswerSubmit(BaseModel):
    session_id: int
    question_id: str
    answer_text: Optional[str] = None
    question_text: Optional[str] = None
    communication_metrics: Optional[dict] = None
    # For audio uploads, we will use Form data instead of JSON payload

class AnswerResponse(BaseModel):
    id: int
    session_id: int
    question_id: str
    question_text: str
    answer_text: Optional[str] = ""
    score: Optional[float] = 0.0
    feedback: Optional[str] = ""
    strengths: Optional[List[str]] = []
    improvements: Optional[List[str]] = []
    keywords_used: Optional[List[str]] = []
    keywords_missed: Optional[List[str]] = []
    filler_word_count: int = 0
    communication_metrics: Optional[dict] = None
    answered_at: datetime

    class Config:
        from_attributes = True
