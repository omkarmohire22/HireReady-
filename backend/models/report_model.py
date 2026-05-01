from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class RecommendedResource(BaseModel):
    skill: str
    link: str
    type: str

class ReportResponse(BaseModel):
    id: int
    session_id: int
    user_id: int
    generated_at: datetime
    overall_score: float
    skill_scores: Dict[str, float]
    category_scores: Dict[str, float]
    strengths: List[str]
    areas_to_improve: List[str]
    missing_skills: List[str]
    recommended_resources: List[RecommendedResource] = []
    pdf_path: Optional[str] = None
    session_summary: str

    class Config:
        from_attributes = True
