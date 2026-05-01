import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.auth_service import get_current_user
from database.connection import get_db
from database.models import User as UserModel
from services.resume_parser import ResumeParserService
from services.skill_matcher import SkillMatcherService

# Create router for all resume-related endpoints
router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)

# Services will be lazily loaded to prevent server crash on startup
parser_service = None
skill_matcher = None

def get_parser_service():
    global parser_service
    if parser_service is None:
        parser_service = ResumeParserService()
    return parser_service

def get_skill_matcher():
    global skill_matcher
    if skill_matcher is None:
        skill_matcher = SkillMatcherService()
    return skill_matcher

# Directory to temporarily save uploaded files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Role → Required Skills mapping ──────────────────────────────────────────
ROLE_SKILLS = {
    "Frontend Developer": [
        "HTML5", "CSS", "JavaScript", "TypeScript", "React", "Next.js",
        "Redux", "Webpack", "REST API", "Git"
    ],
    "Backend Engineer": [
        "Python", "Node.js", "FastAPI", "Django", "REST API",
        "PostgreSQL", "MongoDB", "Redis", "Docker", "Git"
    ],
    "Full Stack Dev": [
        "JavaScript", "TypeScript", "React", "Node.js", "REST API",
        "MongoDB", "PostgreSQL", "Docker", "Git", "GraphQL"
    ],
    "System Design": [
        "Microservices", "Kafka", "Redis", "Docker", "Kubernetes",
        "Load Balancing", "Caching", "SQL", "NoSQL", "AWS"
    ],
    "ML Engineer": [
        "Python", "TensorFlow", "PyTorch", "scikit-learn", "Pandas",
        "NumPy", "Feature Engineering", "Model Deployment", "MLflow", "BERT"
    ],
    "DevOps Engineer": [
        "Docker", "Kubernetes", "CI/CD", "Terraform", "Ansible",
        "AWS", "Linux", "Jenkins", "Git", "Monitoring"
    ],
    "Data Analyst": [
        "Python", "SQL", "Pandas", "NumPy", "Tableau",
        "Power BI", "Excel", "Statistics", "Data Visualization", "ETL"
    ],
}


# ── Request / Response models ────────────────────────────────────────────────
class SkillMatchRequest(BaseModel):
    target_role: str


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts a PDF resume from the user, saves it temporarily,
    extracts the text, identifies skills using NER, and returns a JSON report.
    """
    # 1. Validate the file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # 2. Save file temporarily
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            
        # 3. Process the file using our custom AI service pattern
        extracted_data = get_parser_service().process_resume(file_path)
        
        # 4. Cleanup (remove the temporary file after processing)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # 5. Save extracted skills to the authenticated user's profile
        if "skills" in extracted_data:
            user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
            if user:
                user.resume_skills = extracted_data["skills"]
                db.commit()
            
        return {
            "status": "success",
            "message": "Resume successfully parsed.",
            "data": extracted_data
        }
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match")
async def match_skills(
    body: SkillMatchRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare the user's resume skills (stored in MongoDB from the last upload)
    against the required skills for the selected target role.
    Returns: overall match %, matched skills, and the gap (missing skills).
    """
    # 1. Fetch the user's saved resume skills from PostgreSQL
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    resume_skills = user.resume_skills if user and user.resume_skills else []

    # 2. Determine required skills for the chosen role
    required_skills = ROLE_SKILLS.get(body.target_role)
    if not required_skills:
        available = list(ROLE_SKILLS.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Unknown role '{body.target_role}'. Available roles: {available}"
        )

    # 3. If we have no resume skills yet, return all required as missing
    if not resume_skills:
        return {
            "overall_match_score": 0,
            "matched_skills": [],
            "missing_skills": required_skills,
            "note": "No resume uploaded yet — showing all skills as gaps."
        }

    # 4. Run semantic skill matching via SentenceTransformer
    result = get_skill_matcher().calculate_skill_gap(
        parsed_resume_skills=resume_skills,
        required_skills=required_skills,
        threshold=0.5
    )

    return result
