from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=True)
    subscription = Column(String, default="free")
    avatar_url = Column(String, nullable=True)
    total_sessions = Column(Integer, default=0)
    resume_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sessions = relationship("Session", back_populates="user")
    answers = relationship("Answer", back_populates="user")
    reports = relationship("Report", back_populates="user")

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
