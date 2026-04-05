from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime

from database.connection import users_col
from models.user_model import UserCreate, UserResponse, UserUpdate
from services.auth_service import AuthService, get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    # Check if user exists
    if users_col.find_one({"email": user.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_pass = AuthService.get_password_hash(user.password)
    
    # Create user doc
    user_dict = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_pass,
        "role": None,
        "subscription": "free",
        "avatar_url": None,
        "total_sessions": 0,
        "resume_skills": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = users_col.insert_one(user_dict)
    
    # Fetch newly created user and return
    new_user = users_col.find_one({"_id": result.inserted_id})
    new_user["_id"] = str(new_user["_id"])
    return new_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user by email
    user = users_col.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    # Verify password
    if not AuthService.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    # Create token
    access_token = AuthService.create_access_token(
        data={"sub": str(user["_id"])}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user: UserResponse = Depends(get_current_user)):
    from bson import ObjectId
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items()}
    if update_dict:
        update_dict["updated_at"] = datetime.utcnow()
        users_col.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_dict}
        )
    
    updated_user = users_col.find_one({"_id": ObjectId(current_user.id)})
    updated_user["_id"] = str(updated_user["_id"])
    return updated_user
