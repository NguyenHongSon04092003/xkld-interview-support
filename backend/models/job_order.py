import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from database import Base


class JobOrderStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    pending = "pending"


class JobOrder(Base):
    __tablename__ = "job_order"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    status = Column(Enum(JobOrderStatus), nullable=False)
    job_position = Column(String, nullable=True)
    salary = Column(Numeric(12, 2), nullable=True)
    salary_min = Column(Numeric(12, 2), nullable=True)
    salary_max = Column(Numeric(12, 2), nullable=True)
    location = Column(String, nullable=True)
    quantity = Column(Integer, nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    gender_requirement = Column(String, nullable=True)
    education_level = Column(String, nullable=True)
    experience_required = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    interview_requirement = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    interview_questions = relationship(
        "InterviewQuestion",
        back_populates="job_order",
    )
    mock_interview_sessions = relationship(
        "MockInterviewSession",
        back_populates="job_order",
    )
