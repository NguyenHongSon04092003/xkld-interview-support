import threading
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from ai.behavior_scorer import BehaviorScorer
from ai.final_scorer import FinalScorer
from ai.phobert_scorer import PhoBERTScorer
from database import SessionLocal
from models.mock_interview_answer import MockInterviewAnswer
from models.mock_interview_session import MockInterviewSession
from models.user import User, UserRole

router = APIRouter(prefix="/scoring", tags=["scoring"])
phobert_scorer = PhoBERTScorer()
behavior_scorer = BehaviorScorer()
final_scorer = FinalScorer(phobert_scorer)


class ContentScoreRequest(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


class ContentScoreResponse(BaseModel):
    content_score: float
    semantic_score: float
    keyword_score: float
    feedback: str


class BehaviorScoreRequest(BaseModel):
    session_id: int


class BehaviorScoreResponse(BaseModel):
    final_behavior_score: float
    avg_behavior_score: float
    consistency_score: float
    feedback: str


class AnswerDetailResponse(BaseModel):
    id: int
    question_id: int
    question_content: Optional[str] = None
    answer_text: Optional[str] = None
    content_score: Optional[float] = None
    behavior_score: Optional[float] = None
    feedback: Optional[str] = None


class FinalScoreResponse(BaseModel):
    total_score: float
    avg_content_score: float
    behavior_score: float
    final_feedback: str
    answers_detail: List[AnswerDetailResponse]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def start_model_loading():
    thread = threading.Thread(
        target=_load_model_safely,
        daemon=True,
    )
    thread.start()


def _load_model_safely():
    try:
        phobert_scorer.load_model()
    except Exception as exc:
        print(f"PhoBERT model load failed: {exc}")


def ensure_session_owner_or_manager(session: MockInterviewSession, current_user: User) -> None:
    is_owner = (
        current_user.role == UserRole.candidate
        and session.candidate_id == current_user.id
    )
    is_manager = current_user.role in (UserRole.consultant, UserRole.admin)

    if not is_owner and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to score this interview session",
        )


@router.on_event("startup")
def startup_event():
    start_model_loading()


@router.post("/content", response_model=ContentScoreResponse)
def score_content(
    payload: ContentScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == payload.session_id)
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found",
        )
    ensure_session_owner_or_manager(session, current_user)

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview answer not found",
        )

    try:
        result = phobert_scorer.score_answer(
            payload.question_id,
            payload.answer_text,
            db,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    answer.answer_text = payload.answer_text
    answer.content_score = Decimal(str(result["content_score"]))
    answer.feedback = result["feedback"]
    db.commit()

    return result


@router.post("/final/{session_id}", response_model=FinalScoreResponse)
def score_final(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    ensure_session_owner_or_manager(session, current_user)

    if session.end_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock interview session has not finished",
        )

    if session.behavior_score is None:
        behavior_result = behavior_scorer.score_session(session_id, db)
        session.behavior_score = Decimal(
            str(behavior_result["final_behavior_score"])
        )
        db.commit()
        db.refresh(session)

    return final_scorer.calculate_final_score(session_id, db)


@router.post("/behavior", response_model=BehaviorScoreResponse)
def score_behavior(
    payload: BehaviorScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.id == payload.session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock interview session not found",
        )
    ensure_session_owner_or_manager(session, current_user)

    try:
        result = behavior_scorer.score_session(payload.session_id, db)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    session.behavior_score = Decimal(str(result["final_behavior_score"]))
    db.commit()

    return result
