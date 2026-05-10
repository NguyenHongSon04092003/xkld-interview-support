from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InterviewQuestionBase(BaseModel):
    job_order_id: int
    question_content: str
    sample_answer: Optional[str] = None
    difficulty_level: Optional[str] = None
    score_weight: Optional[Decimal] = None
    display_order: Optional[int] = None

    @field_validator("score_weight")
    @classmethod
    def validate_score_weight(cls, value: Optional[Decimal]) -> Optional[Decimal]:
        if value is not None and value < 0:
            raise ValueError("Trọng số không được nhập số âm")
        return value

    @field_validator("display_order")
    @classmethod
    def validate_display_order(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Số thứ tự không được nhập số âm")
        return value


class InterviewQuestionCreate(InterviewQuestionBase):
    pass


class InterviewQuestionUpdate(BaseModel):
    job_order_id: Optional[int] = None
    question_content: Optional[str] = None
    sample_answer: Optional[str] = None
    difficulty_level: Optional[str] = None
    score_weight: Optional[Decimal] = None
    display_order: Optional[int] = None

    @field_validator("score_weight")
    @classmethod
    def validate_score_weight(cls, value: Optional[Decimal]) -> Optional[Decimal]:
        if value is not None and value < 0:
            raise ValueError("Trọng số không được nhập số âm")
        return value

    @field_validator("display_order")
    @classmethod
    def validate_display_order(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Số thứ tự không được nhập số âm")
        return value


class InterviewQuestionResponse(InterviewQuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    keywords: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
