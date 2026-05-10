from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from models.user import UserRole
from schemas.validators import (
    normalize_email,
    normalize_full_name,
    normalize_password,
    normalize_phone,
)


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return normalize_full_name(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return normalize_password(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        return normalize_phone(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
