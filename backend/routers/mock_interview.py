from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import SessionLocal
from models.interview_question import InterviewQuestion
from models.job_order import JobOrder
from models.mock_interview_answer import MockInterviewAnswer
from models.mock_interview_session import MockInterviewSession
from models.user import User, UserRole
from schemas.mock_interview import (
    AnswerCreate,
    AnswerResponse,
    SessionCreate,
    SessionFinish,
    SessionResponse,
)

router = APIRouter(prefix="/mock-interviews", tags=["mock-interviews"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_existing_session(db: Session, session_id: int) -> MockInterviewSession:
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found",
        )

    return session


def ensure_candidate_exists(db: Session, candidate_id: int) -> None:
    candidate = db.query(User).filter(User.id == candidate_id).first()
    if candidate is None or candidate.role != UserRole.candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )


def ensure_session_owner_or_manager(session: MockInterviewSession, current_user: User) -> None:
    is_owner = (
        current_user.role == UserRole.candidate
        and session.candidate_id == current_user.id
    )
    is_manager = current_user.role in (UserRole.consultant, UserRole.admin)

    if not is_owner and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this interview session",
        )


def ensure_job_order_exists(db: Session, job_order_id: int) -> None:
    job_order = db.query(JobOrder).filter(JobOrder.id == job_order_id).first()
    if job_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job order not found",
        )


def ensure_question_exists(db: Session, question_id: int) -> None:
    question = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.id == question_id)
        .first()
    )
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview question not found",
        )


def calculate_average_score(answers: List[MockInterviewAnswer]) -> Decimal:
    scores = []

    for answer in answers:
        if answer.content_score is not None:
            scores.append(Decimal(answer.content_score))
        if answer.behavior_score is not None:
            scores.append(Decimal(answer.behavior_score))

    if not scores:
        return Decimal("0")

    return sum(scores) / Decimal(len(scores))


@router.post(
    "/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_candidate_exists(db, payload.candidate_id)
    if current_user.role == UserRole.candidate and payload.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidates can only create their own interview sessions",
        )
    if current_user.role not in (UserRole.candidate, UserRole.consultant, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create interview sessions",
        )
    ensure_job_order_exists(db, payload.job_order_id)

    session = MockInterviewSession(
        candidate_id=payload.candidate_id,
        job_order_id=payload.job_order_id,
        start_time=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_existing_session(db, session_id)
    ensure_session_owner_or_manager(session, current_user)
    return session


@router.get(
    "/sessions/candidate/{candidate_id}",
    response_model=List[SessionResponse],
)
def get_candidate_sessions(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_candidate_exists(db, candidate_id)
    if current_user.role == UserRole.candidate and candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidates can only view their own interview history",
        )

    return (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.candidate_id == candidate_id)
        .order_by(MockInterviewSession.created_at.desc())
        .all()
    )


@router.post(
    "/answers",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_answer(
    payload: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_existing_session(db, payload.session_id)
    ensure_session_owner_or_manager(session, current_user)
    if session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock interview session has already finished",
        )

    ensure_question_exists(db, payload.question_id)

    answer = (
        db.query(MockInterviewAnswer)
        .filter(
            MockInterviewAnswer.session_id == payload.session_id,
            MockInterviewAnswer.question_id == payload.question_id,
        )
        .order_by(MockInterviewAnswer.id.desc())
        .first()
    )

    if answer is None:
        answer = MockInterviewAnswer(**payload.model_dump())
        db.add(answer)
    else:
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(answer, field, value)
        answer.content_score = None
        answer.feedback = None

    db.commit()
    db.refresh(answer)
    return answer


@router.put("/sessions/{session_id}/finish", response_model=SessionResponse)
def finish_session(
    session_id: int,
    payload: Optional[SessionFinish] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_existing_session(db, session_id)
    ensure_session_owner_or_manager(session, current_user)
    answers = (
        db.query(MockInterviewAnswer)
        .filter(MockInterviewAnswer.session_id == session_id)
        .all()
    )

    if payload is not None and payload.behavior_score is not None:
        session.behavior_score = payload.behavior_score
    else:
        total_score = calculate_average_score(answers)
        session.behavior_score = total_score
    session.end_time = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session
