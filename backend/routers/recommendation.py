import re
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models.job_order import JobOrder, JobOrderStatus
from schemas.recommendation import CandidateProfile, JobOrderRecommendation

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize(value: Optional[str]) -> str:
    return value.strip().lower() if value else ""


def is_unspecified(value: Optional[str]) -> bool:
    normalized = normalize(value)
    return normalized in {"", "any", "all", "none", "no requirement", "khong yeu cau"}


def extract_required_experience(value: Optional[str]) -> int:
    if not value:
        return 0

    match = re.search(r"\d+", value)
    if match is None:
        return 0

    return int(match.group())


def calculate_score(job_order: JobOrder, profile: CandidateProfile) -> int:
    score = 0

    if (
        job_order.age_min is not None
        and job_order.age_max is not None
        and job_order.age_min <= profile.age <= job_order.age_max
    ):
        score += 30

    if is_unspecified(job_order.gender_requirement) or normalize(job_order.gender_requirement) == normalize(profile.gender):
        score += 20

    if normalize(job_order.education_level) == normalize(profile.education_level):
        score += 20

    required_experience = extract_required_experience(job_order.experience_required)
    if profile.experience_years >= required_experience:
        score += 20

    desired_job = normalize(profile.desired_job)
    job_name = normalize(job_order.job_name)
    job_position = normalize(job_order.job_position)
    if desired_job and (desired_job in job_name or desired_job in job_position):
        score += 10

    return score


@router.post("", response_model=List[JobOrderRecommendation])
def get_recommendations(
    profile: CandidateProfile,
    db: Session = Depends(get_db),
):
    open_job_orders = (
        db.query(JobOrder)
        .filter(JobOrder.status == JobOrderStatus.open)
        .all()
    )

    recommendations = [
        JobOrderRecommendation(
            job_order=job_order,
            score=calculate_score(job_order, profile),
        )
        for job_order in open_job_orders
    ]

    return sorted(
        recommendations,
        key=lambda recommendation: recommendation.score,
        reverse=True,
    )
