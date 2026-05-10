from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class QuestionKeyword(Base):
    __tablename__ = "question_keyword"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(
        Integer,
        ForeignKey("interview_question.id"),
        nullable=False,
    )
    keyword = Column(String, nullable=False)

    question = relationship(
        "InterviewQuestion",
        back_populates="keywords",
    )
