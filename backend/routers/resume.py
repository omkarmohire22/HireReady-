import os
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from services.auth_service import get_current_user
from models.user_model import UserResponse
from database.connection import users_col
from bson import ObjectId
from services.resume_parser import ResumeParserService

# Create router for all resume-related endpoints
router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)

# Initialize the service instance
parser_service = ResumeParserService()

# Directory to temporarily save uploaded files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), current_user: UserResponse = Depends(get_current_user)):
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
            # Read the file contents from the browser and write locally
            content = await file.read()
            buffer.write(content)
            
        # 3. Process the file using our custom AI service pattern
        # This calls pdfminer -> spaCy NER -> json format
        extracted_data = parser_service.process_resume(file_path)
        
        # 4. Cleanup (remove the temporary file after processing)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # 5. Save extracted skills to the authenticated user's profile
        if "skills" in extracted_data:
            users_col.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": {"resume_skills": extracted_data["skills"]}}
            )
            
        return {
            "status": "success",
            "message": "Resume successfully parsed.",
            "data": extracted_data
        }
        
    except Exception as e:
        # In case anything breaks (parse errors, file locking, etc.)
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))
