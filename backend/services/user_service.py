from bson import ObjectId
from database.connection import sessions_col, reports_col

class UserService:
    @staticmethod
    def get_dashboard_stats(user_id: str):
        # Count total sessions
        total_sessions = sessions_col.count_documents({"user_id": ObjectId(user_id)})
        
        # Get all reports to calculate avg score
        reports = list(reports_col.find({"user_id": ObjectId(user_id)}))
        avg_score = 0
        if reports:
            avg_score = sum(r.get("overall_score", 0) for r in reports) / len(reports)
            
        return {
            "total_sessions": total_sessions,
            "average_score": round(avg_score, 1),
            "improvement_trend": "+5%", # Mock for now
        }
