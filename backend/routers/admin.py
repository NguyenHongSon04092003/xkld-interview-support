from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import hash_password, require_admin
from database import SessionLocal
from models.job_order import JobOrder, JobOrderStatus
from models.mock_interview_session import MockInterviewSession
from models.user import User, UserRole
from schemas.user import UserResponse
from schemas.validators import (
    normalize_email,
    normalize_full_name,
    normalize_password,
    normalize_phone,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class UserCreateByAdmin(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole
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


class UserRoleUpdate(BaseModel):
    role: UserRole


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    role_counts = dict(
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    status_counts = dict(
        db.query(JobOrder.status, func.count(JobOrder.id))
        .group_by(JobOrder.status)
        .all()
    )

    return {
        "users": {
            "total": db.query(User).count(),
            "candidates": role_counts.get(UserRole.candidate, 0),
            "consultants": role_counts.get(UserRole.consultant, 0),
            "admins": role_counts.get(UserRole.admin, 0),
        },
        "job_orders": {
            "total": db.query(JobOrder).count(),
            "open": status_counts.get(JobOrderStatus.open, 0),
            "pending": status_counts.get(JobOrderStatus.pending, 0),
            "closed": status_counts.get(JobOrderStatus.closed, 0),
        },
        "interviews": {
            "total_sessions": db.query(MockInterviewSession).count(),
            "finished_sessions": (
                db.query(MockInterviewSession)
                .filter(MockInterviewSession.end_time.isnot(None))
                .count()
            ),
        },
    }


@router.get("/users", response_model=List[UserResponse])
def get_users(
    role: Optional[UserRole] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)

    return query.order_by(User.id.desc()).all()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreateByAdmin,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_admin.id and payload.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin role",
        )

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
