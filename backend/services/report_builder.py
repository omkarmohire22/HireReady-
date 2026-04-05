import os
from datetime import datetime
from bson import ObjectId
from database.connection import reports_col, sessions_col, answers_col

class ReportBuilderService:
    @staticmethod
    def generate_report(session_id: str, user_id: str):
        session = sessions_col.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise ValueError("Session not found")
            
        answers = list(answers_col.find({"session_id": ObjectId(session_id)}))
        
        # Calculate scores
        total_answers = len(answers)
        if total_answers == 0:
            overall_score = 0.0
        else:
            overall_score = sum(ans.get("score", 0.0) for ans in answers) / total_answers
            
        # Mock skill breakdown based on the session's missing skills
        skill_scores = {}
        target_skills = session.get("missing_skills", [])
        for skill in target_skills:
            # We would actually group answers by skill and average them
            skill_scores[skill] = round(overall_score * 0.9, 2)
            
        category_scores = {
            "technical_accuracy": round(overall_score, 2),
            "communication": 85.0 if overall_score > 0 else 0.0,
            "depth": 78.0 if overall_score > 0 else 0.0,
            "confidence": 90.0 if overall_score > 0 else 0.0
        }
        
        report_doc = {
            "session_id": ObjectId(session_id),
            "user_id": ObjectId(user_id),
            "generated_at": datetime.utcnow(),
            "overall_score": round(overall_score, 2),
            "skill_scores": skill_scores,
            "category_scores": category_scores,
            "strengths": ["Strong problem-solving framework", "Clear communication style"] if overall_score > 70 else [],
            "areas_to_improve": ["Deep dive into architecture"],
            "missing_skills": session.get("missing_skills", []),
            "recommended_resources": [
                {"skill": "System Design", "link": "https://example.com/system-design", "type": "article"}
            ],
            "pdf_path": None,
            "session_summary": "Solid performance demonstrating strong foundational knowledge."
        }
        
        # Upsert report
        reports_col.update_one(
            {"session_id": ObjectId(session_id)},
            {"$set": report_doc},
            upsert=True
        )
        
        return reports_col.find_one({"session_id": ObjectId(session_id)})

    @staticmethod
    def generate_pdf(report_data: dict) -> str:
        # In a full implementation, use ReportLab to generate PDF
        return "Not implemented yet"
