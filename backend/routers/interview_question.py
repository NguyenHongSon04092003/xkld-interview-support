from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_consultant_or_admin
from database import SessionLocal
from models.interview_question import InterviewQuestion
from models.job_order import JobOrder
from models.mock_interview_answer import MockInterviewAnswer
from models.question_keyword import QuestionKeyword
from models.user import User
from schemas.interview_question import (
    InterviewQuestionCreate,
    InterviewQuestionResponse,
    InterviewQuestionUpdate,
)

router = APIRouter(prefix="/interview-questions", tags=["interview-questions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_existing_job_order(db: Session, job_order_id: int) -> JobOrder:
    job_order = db.query(JobOrder).filter(JobOrder.id == job_order_id).first()

    if job_order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job order not found",
        )

    return job_order


def get_existing_interview_question(
    db: Session,
    question_id: int,
) -> InterviewQuestion:
    interview_question = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.id == question_id)
        .first()
    )

    if interview_question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview question not found",
        )

    return interview_question


def serialize_interview_question(interview_question: InterviewQuestion) -> dict:
    return {
        "id": interview_question.id,
        "job_order_id": interview_question.job_order_id,
        "question_content": interview_question.question_content,
        "sample_answer": interview_question.sample_answer,
        "difficulty_level": interview_question.difficulty_level,
        "score_weight": interview_question.score_weight,
        "display_order": interview_question.display_order,
        "keywords": [keyword.keyword for keyword in interview_question.keywords],
        "created_at": interview_question.created_at,
        "updated_at": interview_question.updated_at,
    }


@router.get("/{job_order_id}", response_model=List[InterviewQuestionResponse])
def get_interview_questions(
    job_order_id: int,
    db: Session = Depends(get_db),
):
    get_existing_job_order(db, job_order_id)

    interview_questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.job_order_id == job_order_id)
        .order_by(InterviewQuestion.display_order, InterviewQuestion.id)
        .all()
    )
    return [
        serialize_interview_question(interview_question)
        for interview_question in interview_questions
    ]


@router.get("/detail/{id}", response_model=InterviewQuestionResponse)
def get_interview_question(id: int, db: Session = Depends(get_db)):
    return serialize_interview_question(get_existing_interview_question(db, id))


@router.post(
    "",
    response_model=InterviewQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_interview_question(
    payload: InterviewQuestionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    get_existing_job_order(db, payload.job_order_id)

    interview_question = InterviewQuestion(**payload.model_dump())
    db.add(interview_question)
    db.commit()
    db.refresh(interview_question)
    return serialize_interview_question(interview_question)


@router.put("/{id}", response_model=InterviewQuestionResponse)
def update_interview_question(
    id: int,
    payload: InterviewQuestionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    interview_question = get_existing_interview_question(db, id)
    update_data = payload.model_dump(exclude_unset=True)

    if "job_order_id" in update_data:
        get_existing_job_order(db, update_data["job_order_id"])

    for field, value in update_data.items():
        setattr(interview_question, field, value)

    db.commit()
    db.refresh(interview_question)
    return serialize_interview_question(interview_question)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview_question(
    id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_consultant_or_admin),
):
    interview_question = get_existing_interview_question(db, id)

    db.query(MockInterviewAnswer).filter(
        MockInterviewAnswer.question_id == interview_question.id,
    ).delete(synchronize_session=False)
    db.query(QuestionKeyword).filter(
        QuestionKeyword.question_id == interview_question.id,
    ).delete(synchronize_session=False)
    db.delete(interview_question)
    db.commit()
    return None
