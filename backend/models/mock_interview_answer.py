from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from database import Base


class MockInterviewAnswer(Base):
    __tablename__ = "mock_interview_answer"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("mock_interview_session.id"),
        nullable=False,
    )
    question_id = Column(
        Integer,
        ForeignKey("interview_question.id"),
        nullable=False,
    )
    answer_text = Column(Text, nullable=True)
    audio_url = Column(String, nullable=True)
    content_score = Column(Numeric(5, 2), nullable=True)
    behavior_score = Column(Numeric(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship(
        "MockInterviewSession",
        back_populates="answers",
    )
    question = relationship(
        "InterviewQuestion",
        back_populates="mock_interview_answers",
    )
