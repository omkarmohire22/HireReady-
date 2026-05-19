from datetime import datetime
from sqlalchemy.orm import Session
from database.models import Session as SessionModel

class SessionService:
    @staticmethod
    def create_session(db: Session, user_id: int, target_role: str, session_type: str, difficulty: str, target_skills: list, missing_skills: list) -> int:
        session_doc = SessionModel(
            user_id=user_id,
            session_type=session_type,
            target_role=target_role,
            target_skills=target_skills,
            missing_skills=missing_skills,
            difficulty=difficulty,
            status="active",
            questions_answered=0,
        )
        db.add(session_doc)
        db.commit()
        db.refresh(session_doc)
        return session_doc.id

    @staticmethod
    def get_session(db: Session, session_id: int):
        return db.query(SessionModel).filter(SessionModel.id == session_id).first()

    @staticmethod
    def end_session(db: Session, session_id: int):
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            return None

        session.status = "completed"
        session.ended_at = datetime.utcnow()

        db.commit()
        return True
