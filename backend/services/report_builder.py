from datetime import datetime
from sqlalchemy.orm import Session
from database.models import Session as SessionModel, Answer as AnswerModel, Report as ReportModel

class ReportBuilderService:
    @staticmethod
    def generate_report(db: Session, session_id: int, user_id: int):
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise ValueError("Session not found")
            
        answers = db.query(AnswerModel).filter(AnswerModel.session_id == session_id).all()
        
        # Calculate scores
        total_answers = len(answers)
        if total_answers == 0:
            overall_score = 0.0
        else:
            overall_score = sum(ans.score or 0.0 for ans in answers) / total_answers
            
        # Mock skill breakdown based on the session's missing skills
        skill_scores = {}
        target_skills = session.missing_skills or []
        for skill in target_skills:
            # We would actually group answers by skill and average them
            skill_scores[skill] = round(overall_score * 0.9, 2)
            
        category_scores = {
            "technical_accuracy": round(overall_score, 2),
            "communication": 85.0 if overall_score > 0 else 0.0,
            "depth": 78.0 if overall_score > 0 else 0.0,
            "confidence": 90.0 if overall_score > 0 else 0.0
        }
        
        # Check if report already exists
        report = db.query(ReportModel).filter(ReportModel.session_id == session_id).first()
        if not report:
            report = ReportModel(
                session_id=session_id,
                user_id=user_id,
            )
            db.add(report)
            
        report.overall_score = round(overall_score, 2)
        report.skill_scores = skill_scores
        report.category_scores = category_scores
        report.strengths = ["Strong problem-solving framework", "Clear communication style"] if overall_score > 70 else []
        report.areas_to_improve = ["Deep dive into architecture"]
        report.missing_skills = session.missing_skills or []
        report.recommended_resources = [
            {"skill": "System Design", "link": "https://example.com/system-design", "type": "article"}
        ]
        report.pdf_path = None
        report.session_summary = "Solid performance demonstrating strong foundational knowledge."
        report.generated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(report)
        
        return report

    @staticmethod
    def generate_pdf(report_data: dict) -> str:
        # In a full implementation, use ReportLab to generate PDF
        return "Not implemented yet"
