from datetime import datetime
from bson import ObjectId
from database.connection import sessions_col, questions_col, answers_col

class SessionService:
    @staticmethod
    def create_session(user_id: str, target_role: str, session_type: str, difficulty: str, target_skills: list, missing_skills: list) -> str:
        # Convert string user_id to ObjectId if it's a valid 24-character hex string
        parsed_user_id = ObjectId(user_id) if isinstance(user_id, str) and len(user_id) == 24 else user_id
        
        session_doc = {
            "user_id": parsed_user_id,
            "session_type": session_type,
            "target_role": target_role,
            "target_skills": target_skills,
            "missing_skills": missing_skills,
            "difficulty": difficulty,
            "status": "active",
            "started_at": datetime.utcnow(),
            "ended_at": None,
            "total_questions": len(missing_skills) if missing_skills else 5,
            "questions_answered": 0,
            "overall_score": 0.0,
            "duration_seconds": 0
        }
        result = sessions_col.insert_one(session_doc)
        return str(result.inserted_id)

    @staticmethod
    def get_session(session_id: str):
        session = sessions_col.find_one({"_id": ObjectId(session_id)})
        if session:
            session["_id"] = str(session["_id"])
            session["user_id"] = str(session["user_id"])
        return session

    @staticmethod
    def end_session(session_id: str):
        session = sessions_col.find_one({"_id": ObjectId(session_id)})
        if not session:
            return None
            
        ended_at = datetime.utcnow()
        duration = (ended_at - session["started_at"]).total_seconds()
        
        sessions_col.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"status": "completed", "ended_at": ended_at, "duration_seconds": int(duration)}}
        )
        return True
