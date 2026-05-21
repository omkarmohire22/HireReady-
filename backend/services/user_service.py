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
                "target_skills": s.target_skills or [],
                "ago":          ago,
                "score":        round(report.overall_score, 1) if report else 0,
                "tech_score":   round(report.category_scores.get("technical_accuracy", 0), 1) if report and report.category_scores else 0,
                "comm_score":   round(report.category_scores.get("communication", 0), 1) if report and report.category_scores else 0,
            })
        return result

    @staticmethod
    def get_all_sessions(db: Session, user_id: int, skip: int = 0, limit: int = 50):
        """Return ALL sessions for a user with their report scores, newest first."""
        sessions = (
            db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for s in sessions:
            report = db.query(ReportModel).filter(
                ReportModel.session_id == s.id
            ).first()

            now = datetime.now(timezone.utc)
            date_str = ""
            ago = "—"
            if s.created_at:
                created = s.created_at
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                delta_days = (now - created).days
                ago = f"{delta_days}d ago" if delta_days > 0 else "Today"
                date_str = s.created_at.strftime("%Y-%m-%d")

            duration_str = "—"
            if s.created_at and s.ended_at:
                mins = int((s.ended_at - s.created_at).total_seconds() / 60)
                duration_str = f"{mins} min"

            result.append({
                "session_id":         s.id,
                "role":               s.target_role or "—",
                "session_type":       s.session_type or "technical",
                "difficulty":         s.difficulty or "Medium",
                "status":             s.status or "active",
                "questions_answered": s.questions_answered or 0,
                "target_skills":      s.target_skills or [],
                "missing_skills":     s.missing_skills or [],
                "date":               date_str,
                "ago":                ago,
                "duration":           duration_str,
                "score":              round(report.overall_score, 1) if report else None,
                "tech_score":         round(report.category_scores.get("technical_accuracy", 0), 1) if report and report.category_scores else None,
                "comm_score":         round(report.category_scores.get("communication", 0), 1) if report and report.category_scores else None,
                "has_report":         report is not None,
            })
        return result

    @staticmethod
    def get_user_progress(db: Session, user_id: int):
        """Aggregate history of scores, WPM, and filler counts over time"""
        sessions = (
            db.query(SessionModel)
            .filter(SessionModel.user_id == user_id)
            .order_by(SessionModel.created_at.asc())
            .all()
        )

        progress_data = []
        for i, s in enumerate(sessions):
            report = db.query(ReportModel).filter(ReportModel.session_id == s.id).first()
            if report and report.category_scores:
                progress_data.append({
                    "session_number": i + 1,
                    "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else "",
                    "overall_score": report.overall_score or 0,
                    "avg_wpm": report.category_scores.get("avg_wpm", 0),
                    "total_fillers": report.category_scores.get("total_fillers", 0)
                })

        return progress_data
