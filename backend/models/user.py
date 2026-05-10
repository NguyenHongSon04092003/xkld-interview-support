import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class UserRole(str, enum.Enum):
    candidate = "candidate"
    consultant = "consultant"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    mock_interview_sessions = relationship(
        "MockInterviewSession",
        back_populates="candidate",
    )
