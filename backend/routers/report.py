from fastapi import APIRouter, Depends, HTTPException
from database.connection import reports_col
from models.user_model import UserResponse
from models.report_model import ReportResponse
from services.auth_service import get_current_user
from services.report_builder import ReportBuilderService
from bson import ObjectId

router = APIRouter(
    prefix="/api/report",
    tags=["Report"]
)

@router.post("/generate/{session_id}")
async def generate_report(session_id: str, current_user: UserResponse = Depends(get_current_user)):
    try:
        report = ReportBuilderService.generate_report(session_id, current_user.id)
        report["_id"] = str(report["_id"])
        report["session_id"] = str(report["session_id"])
        report["user_id"] = str(report["user_id"])
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{session_id}")
async def get_report(session_id: str, current_user: UserResponse = Depends(get_current_user)):
    report = reports_col.find_one({"session_id": ObjectId(session_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if str(report["user_id"]) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    report["_id"] = str(report["_id"])
    report["session_id"] = str(report["session_id"])
    report["user_id"] = str(report["user_id"])
    return report
