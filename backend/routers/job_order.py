from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_consultant_or_admin
from database import SessionLocal
from models.interview_question import InterviewQuestion
from models.job_order import JobOrder, JobOrderStatus
from models.mock_interview_answer import MockInterviewAnswer
from models.mock_interview_session import MockInterviewSession
from models.question_keyword import QuestionKeyword
from models.user import User
from schemas.job_order import JobOrderCreate, JobOrderResponse, JobOrderUpdate

router = APIRouter(prefix="/job-orders", tags=["job-orders"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=List[JobOrderResponse])
def get_job_orders(
    status: Optional[JobOrderStatus] = None,
    job_position: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(JobOrder)

    if status is not None:
        query = query.filter(JobOrder.status == status)

    if job_position is not None:
        query = query.filter(JobOrder.job_position == job_position)

    return query.order_by(JobOrder.id).all()


@router.get("/{id}", response_model=JobOrderResponse)
def get_job_order(id: int, db: Session = Depends(get_db)):
    job_order = db.query(JobOrder).filter(JobOrder.id == id).first()

    if job_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job order not found",
        )

    return job_order


@router.post(
    "",
    response_model=JobOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job_order(
    payload: JobOrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    job_order = JobOrder(**payload.model_dump())
    db.add(job_order)
    db.commit()
    db.refresh(job_order)
    return job_order


@router.put("/{id}", response_model=JobOrderResponse)
def update_job_order(
    id: int,
    payload: JobOrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    job_order = db.query(JobOrder).filter(JobOrder.id == id).first()

    if job_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job order not found",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job_order, field, value)

    db.commit()
    db.refresh(job_order)
    return job_order


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_order(
    id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    job_order = db.query(JobOrder).filter(JobOrder.id == id).first()

    if job_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job order not found",
        )

    question_ids = [
        question_id
        for (question_id,) in db.query(InterviewQuestion.id)
        .filter(InterviewQuestion.job_order_id == job_order.id)
        .all()
    ]
    session_ids = [
        session_id
        for (session_id,) in db.query(MockInterviewSession.id)
        .filter(MockInterviewSession.job_order_id == job_order.id)
        .all()
    ]

    if session_ids:
        db.query(MockInterviewAnswer).filter(
            MockInterviewAnswer.session_id.in_(session_ids),
        ).delete(synchronize_session=False)

    if question_ids:
        db.query(MockInterviewAnswer).filter(
            MockInterviewAnswer.question_id.in_(question_ids),
        ).delete(synchronize_session=False)
        db.query(QuestionKeyword).filter(
            QuestionKeyword.question_id.in_(question_ids),
        ).delete(synchronize_session=False)
        db.query(InterviewQuestion).filter(
            InterviewQuestion.id.in_(question_ids),
        ).delete(synchronize_session=False)

    if session_ids:
        db.query(MockInterviewSession).filter(
            MockInterviewSession.id.in_(session_ids),
        ).delete(synchronize_session=False)

    db.delete(job_order)
    db.commit()
    return None
