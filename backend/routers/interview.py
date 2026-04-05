from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId

from database.connection import sessions_col, answers_col
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

scorer = FeedbackScorerService()
question_generator = QuestionGeneratorService()

@router.post("/start", response_model=SessionResponse)
async def start_session(session_data: SessionCreate, current_user: UserResponse = Depends(get_current_user)):
    # Mocking some skills for testing if not provided by resume matcher yet
    target_skills = ["Docker", "Python", "React"]
    missing_skills = ["Kubernetes", "AWS"]
    
    session_id = SessionService.create_session(
        user_id=current_user.id,
        target_role=session_data.target_role,
        session_type=session_data.session_type,
        difficulty=session_data.difficulty,
        target_skills=target_skills,
        missing_skills=missing_skills
    )
    
    session = SessionService.get_session(session_id)
    return session

@router.get("/{session_id}/next")
async def get_next_question(session_id: str, current_user: UserResponse = Depends(get_current_user)):
    session = SessionService.get_session(session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session["status"] == "completed":
        return {"message": "Session is already completed"}
        
    missing_skills = session.get("missing_skills", [])
    questions_answered = session.get("questions_answered", 0)
    
    if questions_answered >= len(missing_skills):
        return {"message": "All questions answered. Ready to end session."}
        
    skill_to_test = missing_skills[questions_answered]
    
    # Generate question using FLAN-T5
    gen_result = question_generator.generate_question(skill=skill_to_test, role=session["target_role"])
    
    question_text = gen_result.get("generated_question", f"Can you explain your experience with {skill_to_test}?")
    
    return {
        "question_id": f"q_{questions_answered}",
        "skill": skill_to_test,
        "question_text": question_text
    }

@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(answer_data: AnswerSubmit, current_user: UserResponse = Depends(get_current_user)):
    session = SessionService.get_session(answer_data.session_id)
    if not session or session["user_id"] != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    missing_skills = session.get("missing_skills", ["General"])
    idx = session.get("questions_answered", 0)
    skill_to_test = missing_skills[idx] if idx < len(missing_skills) else "General"
    
    # Very simple mock keywords based on skill
    expected_keywords = [skill_to_test, "experience", "implemented"]
    
    score_result = scorer.score(
        answer_text=answer_data.answer_text or "",
        question_text="", # Passed empty for now
        expected_keywords=expected_keywords,
        difficulty=session["difficulty"]
    )
    
    # Save the answer
    answer_doc = {
        "session_id": ObjectId(answer_data.session_id),
        "user_id": ObjectId(current_user.id),
        "question_id": answer_data.question_id,
        "question_text": "Saved question text",
        "answer_text": answer_data.answer_text,
        "score": score_result["score"],
        "feedback": score_result["feedback"],
        "strengths": score_result["strengths"],
        "improvements": score_result["improvements"],
        "keywords_used": score_result["keywords_used"],
        "keywords_missed": score_result["keywords_missed"],
        "filler_word_count": score_result["filler_word_count"],
        "answered_at": datetime.utcnow()
    }
    
    result = answers_col.insert_one(answer_doc)
    
    # Update Session counts
    sessions_col.update_one(
        {"_id": ObjectId(answer_data.session_id)},
        {"$inc": {"questions_answered": 1}}
    )
    
    answer_doc["_id"] = str(result.inserted_id)
    answer_doc["session_id"] = str(answer_doc["session_id"])
    answer_doc["user_id"] = str(answer_doc["user_id"])
    
    return answer_doc

@router.put("/{session_id}/end")
async def end_session(session_id: str, current_user: UserResponse = Depends(get_current_user)):
    SessionService.end_session(session_id)
    return {"message": "Session completed successfully"}
