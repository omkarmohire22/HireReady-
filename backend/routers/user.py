from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User as UserModel
from services.auth_service import get_current_user
from services.user_service import UserService

router = APIRouter(
    prefix="/api/user",
    tags=["User Dashboard"]
)

@router.get("/dashboard")
async def get_dashboard(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stats = UserService.get_dashboard_stats(db, current_user.id)
    return stats

@router.get("/sessions/recent")
async def get_recent_sessions(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = UserService.get_recent_sessions(db, current_user.id, limit=5)
    return sessions


