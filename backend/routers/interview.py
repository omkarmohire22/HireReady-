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
# QuestionGeneratorService imported lazily to prevent startup crashes from transformers/torch version bugs.

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
    """Lazily import and instantiate QuestionGeneratorService to avoid startup crashes."""
    global question_generator
    if question_generator is None:
        try:
            from services.question_generator import QuestionGeneratorService
            question_generator = QuestionGeneratorService()
        except Exception as e:
            print(f"[WARNING] QuestionGeneratorService failed to load: {e}")
            question_generator = None
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
    # Role-specific default skills (used when no resume was uploaded)
    ROLE_DEFAULTS = {
        "ML Engineer":        ["PyTorch", "Scikit-Learn", "Feature Engineering", "Model Deployment", "BERT"],
        "Frontend Developer": ["React", "TypeScript", "CSS", "Redux", "Webpack"],
        "Backend Engineer":   ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
        "Full Stack Dev":     ["React", "Node.js", "MongoDB", "Docker", "GraphQL"],
        "System Design":      ["Microservices", "Kafka", "Redis", "Kubernetes", "Load Balancing"],
        "DevOps Engineer":    ["Docker", "Kubernetes", "CI/CD", "Terraform", "AWS"],
        "Data Analyst":       ["SQL", "Pandas", "Tableau", "Statistics", "ETL"],
    }
    missing_skills = (
        session_data.missing_skills
        or ROLE_DEFAULTS.get(session_data.target_role, ["Python", "System Design", "Problem Solving"])
    )

    # Feature Gating: Free users get 2 sessions max
    from database.models import Session as SessionModel
    from datetime import datetime, timedelta, timezone

    if current_user.subscription != "pro":
        # Check sessions created in the last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_sessions_count = db.query(SessionModel).filter(
            SessionModel.user_id == current_user.id,
            SessionModel.created_at >= thirty_days_ago
        ).count()
        
        if recent_sessions_count >= 2:
            raise HTTPException(
                status_code=403, 
                detail="Free plan limit reached (2 mock interviews per month). Please upgrade to Pro to continue."
            )

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
    session_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Return the next AI-generated question using the FLAN-T5 model.
    Cycles through the user's identified missing skills.
    """
    session = None
    if session_id == "demo123":
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
    else:
        try:
            session = SessionService.get_session(db, int(session_id))
        except ValueError:
            pass
            
    if not session or session.user_id != current_user.id:
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
        
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.status == "completed":
        return {"message": "Session is already completed", "done": True}
        
    missing_skills = session.missing_skills or []
    questions_answered = session.questions_answered or 0
    difficulty = session.difficulty or "Medium"
    stype = session.session_type or "technical"

    # ── Intelligent Dynamic Follow-Up Question System ──
    from database.models import Answer as AnswerModel
    last_answer = db.query(AnswerModel).filter(AnswerModel.session_id == session.id).order_by(AnswerModel.id.desc()).first()
    
    if last_answer and "followup" not in last_answer.question_id and last_answer.answer_text:
        ans_text_lower = last_answer.answer_text.lower()
        triggered_q = None
        triggered_skill = None
        
        FOLLOWUP_TRIGGERS = {
            "state": ("React", "You mentioned 'state'. What is the fundamental difference between useState and useReducer in React, and when would you prefer useReducer?"),
            "effect": ("React", "You touched on 'effects'. How do you handle cleanup in useEffect to prevent memory leaks in production?"),
            "context": ("React", "You mentioned 'context'. How do you prevent unnecessary child re-renders when Context values change?"),
            "decorator": ("Python", "You mentioned 'decorators'. Can you explain how a decorator function operates under the hood in Python?"),
            "generator": ("Python", "You mentioned 'generators'. What is the difference between 'yield' and 'return' in a Python generator?"),
            "container": ("Docker", "You mentioned 'containers'. Technically speaking, what is the core architectural difference between a Docker container and a Virtual Machine?"),
            "volume": ("Docker", "You mentioned 'volumes'. How does Docker handle data persistence outside of a container's filesystem lifecycle?"),
            "ec2": ("AWS", "You mentioned 'EC2'. How would you decide whether to allocate On-Demand, Reserved, or Spot EC2 instances for an application?"),
            "lambda": ("AWS", "You mentioned serverless or 'Lambda'. How do you diagnose and mitigate cold start latency in serverless architectures?"),
            "pod": ("Kubernetes", "You mentioned 'pods'. How does Kubernetes manage container scheduling and shared network namespaces inside a Pod?"),
            "service": ("Kubernetes", "You mentioned 'services'. What is the technical routing difference between ClusterIP, NodePort, and LoadBalancer service types?"),
            "index": ("SQL", "You mentioned 'indexing'. How does a B-Tree database index accelerate reads, and what is its overhead on write transactions?"),
            "join": ("SQL", "You mentioned 'joins'. Can you explain the execution difference between a Hash Join, a Merge Join, and a Nested Loop Join?")
        }
        
        for key, (skill, q_text) in FOLLOWUP_TRIGGERS.items():
            if f" {key}" in f" {ans_text_lower}":
                triggered_q = q_text
                triggered_skill = skill
                break
                
        if triggered_q:
            return {
                "question_id":      f"{last_answer.question_id}_followup",
                "skill":            triggered_skill,
                "question_text":    triggered_q,
                "difficulty":       difficulty,
                "total_questions":  len(missing_skills),
                "question_number":  questions_answered,
                "done":             False,
            }

    if not missing_skills or questions_answered >= len(missing_skills):
        return {"message": "All questions answered. Ready to end session.", "done": True}

    skill_to_test = missing_skills[questions_answered]

    # ── Anti-repetition: fetch all already-asked question texts for this session
    asked_rows = db.query(AnswerModel.question_text).filter(
        AnswerModel.session_id == session.id
    ).all()
    exclude_list = [row[0] for row in asked_rows if row[0]]

    # ── Generate question: bank → CSV → FLAN-T5 → template (all difficulty-aware)
    generator = get_question_generator()
    if generator is not None:
        gen_result = generator.generate_question(
            skill=skill_to_test,
            role=session.target_role,
            exclude=exclude_list,
            difficulty=difficulty,
            session_type=stype,
        )
        question_text = gen_result.get(
            "generated_question",
            f"Walk me through your experience with {skill_to_test} as a {session.target_role}."
        )
        source_difficulty = gen_result.get("difficulty", difficulty)
    else:
        # Hardcoded fallback when model service is completely unavailable
        difficulty_prompts = {
            "Easy":   f"What is {skill_to_test} and why is it important for a {session.target_role}?",
            "Medium": f"You are a {session.target_role}. Walk me through integrating {skill_to_test} into a production system.",
            "Hard":   f"You are a {session.target_role}. A production incident has been traced to your {skill_to_test} implementation. Diagnose and resolve it.",
        }
        question_text = difficulty_prompts.get(difficulty, difficulty_prompts["Medium"])
        source_difficulty = difficulty

    return {
        "question_id":      f"q_{questions_answered + 1}",
        "skill":            skill_to_test,
        "question_text":    question_text,
        "difficulty":       source_difficulty,
        "total_questions":  len(missing_skills),
        "question_number":  questions_answered + 1,
        "done":             False,
    }


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str,
    answer_data: AnswerSubmit,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Score and save the user's transcribed answer for a question.
    Keywords are derived from the question text using NLP instead of mock values.
    """
    session = None
    if session_id == "demo123":
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
    else:
        try:
            session = SessionService.get_session(db, int(session_id))
        except ValueError:
            pass
            
    if not session or session.user_id != current_user.id:
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
        
    if not session:
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
        session_id=session.id,
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
        filler_word_count=score_result["filler_word_count"],
        communication_metrics=answer_data.communication_metrics or {}
    )
    db.add(new_answer)
    
    # AI Feedback Loop: Update Question analytics
    from database.models import Question as QuestionModel
    q_record = db.query(QuestionModel).filter(QuestionModel.question_text == question_text).first()
    if not q_record:
        q_record = QuestionModel(
            role=session.target_role,
            skill=skill_to_test,
            difficulty=session.difficulty,
            question_type="Generated",
            question_text=question_text,
            expected_keywords=expected_keywords,
            source="flan-t5",
            times_used=0,
            avg_score_received=0.0
        )
        db.add(q_record)
        db.flush() # get ID without full commit
        
    q_record.times_used = (q_record.times_used or 0) + 1
    current_avg_score = q_record.avg_score_received or 0.0
    q_record.avg_score_received = ((current_avg_score * (q_record.times_used - 1)) + float(score_result["score"])) / q_record.times_used
    
    # ── Adaptive Difficulty Adjustment ──
    all_prev_answers = db.query(AnswerModel).filter(AnswerModel.session_id == session.id).all()
    all_scores = [float(ans.score) for ans in all_prev_answers] + [float(score_result["score"])]
    if all_scores:
        running_avg = sum(all_scores) / len(all_scores)
        if running_avg >= 7.5:
            session.difficulty = "Hard"
        elif running_avg < 4.5:
            session.difficulty = "Easy"
        else:
            session.difficulty = "Medium"

    # Increment the answered-questions counter on the session
    session.questions_answered = (session.questions_answered or 0) + 1
    
    db.commit()
    db.refresh(new_answer)
    
    return new_answer


@router.put("/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark the session as completed."""
    session = None
    if session_id == "demo123":
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
    else:
        try:
            session = SessionService.get_session(db, int(session_id))
        except ValueError:
            pass
            
    if not session or session.user_id != current_user.id:
        from database.models import Session as SessionModel
        session = db.query(SessionModel).filter(SessionModel.user_id == current_user.id).order_by(SessionModel.created_at.desc()).first()
        
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    SessionService.end_session(db, session.id)
    return {"message": "Session completed successfully"}
