from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    candidate_id: int
    job_order_id: int


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    job_order_id: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    total_score: Optional[Decimal] = None
    content_score: Optional[Decimal] = None
    behavior_score: Optional[Decimal] = None
    final_feedback: Optional[str] = None
    created_at: datetime


class AnswerCreate(BaseModel):
    session_id: int
    question_id: int
    answer_text: Optional[str] = None
    audio_url: Optional[str] = None
    behavior_score: Optional[Decimal] = None


class SessionFinish(BaseModel):
    behavior_score: Optional[Decimal] = None


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    question_id: int
    answer_text: Optional[str] = None
    audio_url: Optional[str] = None
    content_score: Optional[Decimal] = None
    behavior_score: Optional[Decimal] = None
    feedback: Optional[str] = None
    created_at: datetime
