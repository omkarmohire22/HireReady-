from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User as UserModel
from database.models import Report as ReportModel
from models.user_model import UserResponse
from models.report_model import ReportResponse
from services.auth_service import get_current_user
from services.report_builder import ReportBuilderService

router = APIRouter(
    prefix="/api/report",
    tags=["Report"]
)

@router.post("/generate/{session_id}", response_model=ReportResponse)
async def generate_report(
    session_id: int, 
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        report = ReportBuilderService.generate_report(db, session_id, current_user.id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: int, 
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(ReportModel).filter(ReportModel.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return report
