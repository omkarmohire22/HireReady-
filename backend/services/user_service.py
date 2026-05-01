from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database.models import Session as SessionModel, Report as ReportModel

class UserService:
    @staticmethod
    def get_dashboard_stats(db: Session, user_id: int):
        # Count total sessions
        total_sessions = db.query(SessionModel).filter(
            SessionModel.user_id == user_id
        ).count()

        # Get all reports to calculate avg score
        reports = db.query(ReportModel).filter(
            ReportModel.user_id == user_id
        ).all()
        avg_score = 0.0
        if reports:
            avg_score = sum(r.overall_score or 0.0 for r in reports) / len(reports)

        # Estimate time practiced — sum duration from ended sessions (default 15 min each)
        sessions = db.query(SessionModel).filter(
            SessionModel.user_id == user_id
        ).all()
        total_minutes = 0
        for s in sessions:
            if s.created_at and s.ended_at:
                duration = (s.ended_at - s.created_at).total_seconds() / 60
                total_minutes += duration
            else:
                total_minutes += 15  # default estimate

        time_practiced_hours = round(total_minutes / 60, 1)

        return {
            "total_sessions": total_sessions,
            "average_score": round(avg_score, 1),
            "improvement_trend": "+5%",
            "time_practiced_hours": time_practiced_hours,
        }

    @staticmethod
    def get_recent_sessions(db: Session, user_id: int, limit: int = 5):
        """Return the most recent sessions with their report scores."""
        sessions = (
            db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.created_at.desc())
            .limit(limit)
            .all()
        )

        result = []
        for s in sessions:
            # Grab associated report if it exists
            report = db.query(ReportModel).filter(
                ReportModel.session_id == s.id
            ).first()

            now = datetime.now(timezone.utc)
            if s.created_at:
                created = s.created_at
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                delta_days = (now - created).days
                ago = f"{delta_days}d ago" if delta_days > 0 else "Today"
            else:
                ago = "—"

            result.append({
                "session_id":   s.id,
                "role":         s.target_role or "—",
                "session_type": s.session_type or "Technical",
                "difficulty":   s.difficulty or "Medium",
                "ago":          ago,
                "score":        round(report.overall_score, 1) if report else 0,
                "tech_score":   round(report.category_scores.get("technical_accuracy", 0), 1) if report and report.category_scores else 0,
                "comm_score":   round(report.category_scores.get("communication", 0), 1) if report and report.category_scores else 0,
            })
        return result
