from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from database import Base


class InterviewQuestion(Base):
    __tablename__ = "interview_question"

    id = Column(Integer, primary_key=True, index=True)
    job_order_id = Column(Integer, ForeignKey("job_order.id"), nullable=False)
    question_content = Column(Text, nullable=False)
    sample_answer = Column(Text, nullable=True)
    difficulty_level = Column(String, nullable=True)
    score_weight = Column(Numeric(5, 2), nullable=True)
    display_order = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    job_order = relationship(
        "JobOrder",
        back_populates="interview_questions",
    )
    keywords = relationship(
        "QuestionKeyword",
        back_populates="question",
    )
    mock_interview_answers = relationship(
        "MockInterviewAnswer",
        back_populates="question",
    )
