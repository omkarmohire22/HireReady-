from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User as UserModel
from database.models import Session as SessionModel
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/api/roadmap",
    tags=["Learning Roadmap"]
)

@router.get("/{session_id}")
async def get_roadmap(
    session_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dynamically generates a 4-week learning roadmap based on the missing skills
    identified in the user's interview session.
    """
    # 1. Fetch the session
    session = None
    if session_id == "demo123":
        # Robust fallback: fetch the user's most recent session
        session = db.query(SessionModel).filter(
            SessionModel.user_id == current_user.id
        ).order_by(SessionModel.created_at.desc()).first()
    else:
        try:
            sess_id_int = int(session_id)
            session = db.query(SessionModel).filter(SessionModel.id == sess_id_int).first()
        except ValueError:
            pass

    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    missing_skills = session.missing_skills or []
    target_role = session.target_role or "Software Engineer"
    
    # 2. Dynamic generation logic
    # If no missing skills, provide an advanced track.
    if not missing_skills:
        missing_skills = ["Advanced Architecture", "System Scaling", "Performance Optimization"]
        
    stages = []
    
    # We will chunk the missing skills across up to 4 weeks
    # If there are fewer than 4 skills, we pad them with generic important skills for the role.
    skills_to_learn = list(missing_skills)
    
    # Generic paddings based on role
    generic_skills = ["System Design", "Communication", "Leadership", "Debugging", "Code Review"]
    while len(skills_to_learn) < 4:
        for gs in generic_skills:
            if gs not in skills_to_learn:
                skills_to_learn.append(gs)
                break

    # Week 1: Core Fundamentals (First skill)
    stages.append({
        "week": "Week 1 (Days 1 to 7)",
        "title": f"Mastering {skills_to_learn[0]} Fundamentals",
        "topics": [
            "Day 1-2: Core theoretical foundations, interview syntax, and pattern recognition.",
            "Day 3-4: Build three functional exercises / algorithms on your local environment.",
            "Day 5-7: Solve 5 target mock-questions and practice speaking answers clearly."
        ],
        "progress": 0,
        "color": "#FFB547" # Warning/Amber
    })
    
    # Week 2: Secondary Skill
    stages.append({
        "week": "Week 2 (Days 8 to 14)",
        "title": f"Deep Dive: {skills_to_learn[1]} Integration",
        "topics": [
            "Day 8-9: Advanced concepts, edge cases, and state management review.",
            "Day 10-12: Create a complete miniature modular production component utilizing standard practices.",
            "Day 13-14: Practice answering architecture questions using the STAR framework."
        ],
        "progress": 0,
        "color": "#00E5FF" # Accent/Cyan
    })

    # Week 3: Tertiary Skill & Integration
    stages.append({
        "week": "Week 3 (Days 15 to 21)",
        "title": f"{skills_to_learn[2]} & Distributed Architectures",
        "topics": [
            "Day 15-16: Integrating third-party components and caching/database layers.",
            "Day 17-18: System design scaling patterns, performance bottleneck analysis.",
            "Day 19-21: Simulated code reviews and high-level structural delivery exercise."
        ],
        "progress": 0,
        "color": "#6C47FF" # Primary/Purple
    })

    # Week 4: Final Skill & Mock Interviews
    stages.append({
        "week": "Week 4 (Days 22 to 28)",
        "title": f"Polish & Full Mock Interviews",
        "topics": [
            "Day 22-23: Final polish of {skills_to_learn[3]} and behavioral review.",
            "Day 24-25: Run two simulated mock interviews on HireReady.",
            "Day 26-28: Calibrate speaking speed (WPM), eliminate filler words, and review feedback logs."
        ],
        "progress": 0,
        "color": "#00D97E" # Success/Green
    })

    # Fake some progress for demo purposes (usually this would be tracked in DB)
    stages[0]["progress"] = 100
    stages[1]["progress"] = 45

    total_progress = sum(s["progress"] for s in stages) // len(stages)

    return {
        "status": "success",
        "target_role": target_role,
        "total_progress": total_progress,
        "stages": stages
    }
