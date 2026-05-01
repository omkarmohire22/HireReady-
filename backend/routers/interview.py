from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User as UserModel
from database.models import Answer as AnswerModel
from models.user_model import UserResponse
from models.session_model import SessionCreate, SessionResponse
from models.answer_model import AnswerSubmit, AnswerResponse
from services.auth_service import get_current_user
from services.session_service import SessionService
from services.feedback_scorer import FeedbackScorerService
from services.question_generator import QuestionGeneratorService

router = APIRouter(
    prefix="/api/interview",
    tags=["Interview Session"]
)

scorer = None
question_generator = None

def get_scorer():
    global scorer
    if scorer is None:
        scorer = FeedbackScorerService()
    return scorer

def get_question_generator():
    global question_generator
    if question_generator is None:
        question_generator = QuestionGeneratorService()
    return question_generator

# ── spaCy-based keyword extractor (noun chunks + named entities) ─────────────
def extract_keywords_from_question(question_text: str, skill: str) -> List[str]:
    """
    Extracts meaningful keywords from the generated question using spaCy.
    Falls back to a simple split-based approach if spaCy is unavailable.
    """
    keywords = [skill]  # always include the target skill
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Model not downloaded yet — use simple fallback
            raise ImportError("spaCy model not found")
        
        doc = nlp(question_text)
        for chunk in doc.noun_chunks:
            token = chunk.root.text.lower()
            if len(token) > 3 and token not in {"time", "step", "case", "way", "thing", "user", "team"}:
                keywords.append(token)
        for ent in doc.ents:
            if ent.label_ in {"ORG", "PRODUCT", "LANGUAGE", "TECH"}:
                keywords.append(ent.text.lower())
    except (ImportError, Exception):
        # Fallback: extract capitalized words (likely technical terms)
        import re
        tech_terms = re.findall(r'\b[A-Z][a-zA-Z0-9+#.]{2,}\b', question_text)
        keywords.extend([t.lower() for t in tech_terms])

    # Deduplicate while preserving order
    seen = set()
    result = []
    for kw in keywords:
        if kw.lower() not in seen:
            seen.add(kw.lower())
            result.append(kw)
    return result[:8]  # cap at 8 keywords


# ── Pydantic model for session start with real missing skills ────────────────
class SessionStartRequest(BaseModel):
    target_role: str
    session_type: str = "technical"
    difficulty: str = "Medium"
    missing_skills: Optional[List[str]] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/start", response_model=SessionResponse)
async def start_session(
    session_data: SessionStartRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new interview session.
    Accepts real missing_skills from the frontend (derived from SkillMatcher).
    Falls back to sensible defaults if none are provided.
    """
    # Use the real missing skills passed from SkillAlignment, or use defaults
    missing_skills = session_data.missing_skills or ["Python", "Docker", "REST API"]

    session_id = SessionService.create_session(
        db=db,
        user_id=current_user.id,
        target_role=session_data.target_role,
        session_type=session_data.session_type,
        difficulty=session_data.difficulty,
        target_skills=[],          # target_skills not used in question–gen pipeline
        missing_skills=missing_skills
    )
    
    session = SessionService.get_session(db, session_id)
    return session


@router.get("/{session_id}/next")
async def get_next_question(
    session_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return the next AI-generated question using the FLAN-T5 model.
    Cycles through the user's identified missing skills.
    """
    session = SessionService.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status == "completed":
        return {"message": "Session is already completed", "done": True}
        
    missing_skills = session.missing_skills or []
    questions_answered = session.questions_answered or 0
    
    if questions_answered >= len(missing_skills):
        return {"message": "All questions answered. Ready to end session.", "done": True}
        
    skill_to_test = missing_skills[questions_answered]
    
    # Generate question using FLAN-T5
    gen_result = get_question_generator().generate_question(
        skill=skill_to_test,
        role=session.target_role
    )
    question_text = gen_result.get(
        "generated_question",
        f"Can you explain your experience with {skill_to_test}?"
    )
    
    return {
        "question_id": f"q_{questions_answered}",
        "skill": skill_to_test,
        "question_text": question_text,
        "total_questions": len(missing_skills),
        "question_number": questions_answered + 1,
        "done": False
    }


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: int,
    answer_data: AnswerSubmit,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Score and save the user's transcribed answer for a question.
    Keywords are derived from the question text using NLP instead of mock values.
    """
    session = SessionService.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    missing_skills = session.missing_skills or ["General"]
    idx = session.questions_answered or 0
    skill_to_test = missing_skills[idx] if idx < len(missing_skills) else "General"
    
    # Derive real keywords from the question text using NLP
    question_text = answer_data.question_text or f"Explain your experience with {skill_to_test}"
    expected_keywords = extract_keywords_from_question(question_text, skill_to_test)
    
    score_result = get_scorer().score(
        answer_text=answer_data.answer_text or "",
        question_text=question_text,
        expected_keywords=expected_keywords,
        difficulty=session.difficulty
    )
    
    # Save the answer with the real question text
    new_answer = AnswerModel(
        session_id=session_id,
        user_id=current_user.id,
        question_id=answer_data.question_id,
        question_text=question_text,
        answer_text=answer_data.answer_text,
        score=score_result["score"],
        feedback=score_result["feedback"],
        strengths=score_result["strengths"],
        improvements=score_result["improvements"],
        keywords_used=score_result["keywords_used"],
        keywords_missed=score_result["keywords_missed"],
        filler_word_count=score_result["filler_word_count"]
    )
    db.add(new_answer)
    
    # Increment the answered-questions counter on the session
    session.questions_answered += 1
    
    db.commit()
    db.refresh(new_answer)
    
    return new_answer


@router.put("/{session_id}/end")
async def end_session(
    session_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark the session as completed."""
    session = SessionService.get_session(db, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    SessionService.end_session(db, session_id)
    return {"message": "Session completed successfully"}
