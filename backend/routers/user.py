import os
import uuid
import shutil
from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException
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

@router.get("/sessions")
async def get_all_sessions(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Return ALL sessions for the current user (paginated), newest first."""
    sessions = UserService.get_all_sessions(db, current_user.id, skip=skip, limit=limit)
    return sessions

@router.post("/upgrade")
async def upgrade_user_plan(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.subscription = "pro"
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "subscription": current_user.subscription, "message": "Successfully upgraded to Pro plan."}


@router.get("/progress")
async def get_progress(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    progress = UserService.get_user_progress(db, current_user.id)
    return progress


@router.post("/avatar/upload")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a user profile avatar image from the gallery.
    Saves file to 'uploads/avatars/' and updates user.avatar_url.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        raise HTTPException(status_code=400, detail="Invalid image type. Please upload PNG, JPG, JPEG, WEBP or GIF.")

    avatar_dir = os.path.join("uploads", "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(avatar_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    avatar_url = f"/uploads/avatars/{unique_filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)

    return {
        "status": "success",
        "avatar_url": avatar_url,
        "message": "Avatar uploaded successfully from gallery."
    }

# ─── Notifications Endpoints ───────────────────────────────────────────────
from database.models import Notification as NotificationModel

@router.get("/notifications")
async def get_notifications(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id
    ).order_by(NotificationModel.created_at.desc()).all()
    
    # Seed default notifications if none exist
    if not notifications:
        default_notifs = [
            {
                "title": "Welcome to HireReady! 🎉",
                "message": "Tailor your interview prep by uploading a resume inside the Practice Arena."
            },
            {
                "title": "Pro Access Available ⚡",
                "message": "Upgrade your plan to unlock unlimited sessions and advanced communication analytics."
            },
            {
                "title": "Database Preference Syncing 🌓",
                "message": "Your Light/Dark mode settings are now saved in your account profile and synced globally."
            }
        ]
        for notif_data in default_notifs:
            new_notif = NotificationModel(
                user_id=current_user.id,
                title=notif_data["title"],
                message=notif_data["message"],
                read=False
            )
            db.add(new_notif)
        db.commit()
        # Refetch
        notifications = db.query(NotificationModel).filter(
            NotificationModel.user_id == current_user.id
        ).order_by(NotificationModel.created_at.desc()).all()
        
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "read": n.read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]

@router.post("/notifications/{notif_id}/read")
async def mark_notification_read(
    notif_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(NotificationModel).filter(
        NotificationModel.id == notif_id,
        NotificationModel.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(NotificationModel).filter(
        NotificationModel.user_id == current_user.id,
        NotificationModel.read == False
    ).update({NotificationModel.read: True}, synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}

