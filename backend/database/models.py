from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for Google OAuth users
    role = Column(String, nullable=True)
    subscription = Column(String, default="free")
    avatar_url = Column(String, nullable=True)
    theme = Column(String, default="dark")
    total_sessions = Column(Integer, default=0)
    resume_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sessions = relationship("Session", back_populates="user")
    answers = relationship("Answer", back_populates="user")
    reports = relationship("Report", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_role = Column(String, nullable=False)
    session_type = Column(String, default="technical")
    difficulty = Column(String, default="Medium")
    target_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    questions_answered = Column(Integer, default=0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="sessions")
    answers = relationship("Answer", back_populates="session")
    reports = relationship("Report", back_populates="session")

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(String, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    improvements = Column(JSON, default=list)
    keywords_used = Column(JSON, default=list)
    keywords_missed = Column(JSON, default=list)
    filler_word_count = Column(Integer, default=0)
    communication_metrics = Column(JSON, default=dict)
    answered_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="answers")
    session = relationship("Session", back_populates="answers")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    overall_score = Column(Float, nullable=False)
    skill_scores = Column(JSON, default=dict)
    category_scores = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    areas_to_improve = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    recommended_resources = Column(JSON, default=list)
    pdf_path = Column(String, nullable=True)
    session_summary = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reports")
    session = relationship("Session", back_populates="reports")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True, nullable=False)
    skill = Column(String, index=True, nullable=False)
    difficulty = Column(String, index=True, nullable=False)  # Easy, Medium, Hard
    question_type = Column(String, nullable=False)           # Conceptual, Scenario, Design, Debugging, Behavioural
    question_text = Column(Text, nullable=False)
    expected_keywords = Column(JSON, default=list)           # Keywords to look for in the answer
    source = Column(String, default="generated")             # e.g., "seed", "flan-t5"
    approved = Column(Integer, default=1)                    # 1 = True, 0 = False
    
    # Advanced tracking for AI feedback loop
    times_used = Column(Integer, default=0)
    avg_score_received = Column(Float, default=0.0)
    quality_rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")
