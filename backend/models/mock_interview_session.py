from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from database import Base


class MockInterviewSession(Base):
    __tablename__ = "mock_interview_session"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_order_id = Column(Integer, ForeignKey("job_order.id"), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    total_score = Column(Numeric(5, 2), nullable=True)
    content_score = Column(Numeric(5, 2), nullable=True)
    behavior_score = Column(Numeric(5, 2), nullable=True)
    final_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    candidate = relationship(
        "User",
        back_populates="mock_interview_sessions",
    )
    job_order = relationship(
        "JobOrder",
        back_populates="mock_interview_sessions",
    )
    answers = relationship(
        "MockInterviewAnswer",
        back_populates="session",
    )
