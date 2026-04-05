from fastapi import APIRouter, Depends
from models.user_model import UserResponse
from services.auth_service import get_current_user
from services.user_service import UserService

router = APIRouter(
    prefix="/api/user",
    tags=["User Dashboard"]
)

@router.get("/dashboard")
async def get_dashboard(current_user: UserResponse = Depends(get_current_user)):
    stats = UserService.get_dashboard_stats(current_user.id)
    return stats
