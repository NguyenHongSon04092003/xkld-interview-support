from pydantic import BaseModel, Field

from schemas.job_order import JobOrderResponse


class CandidateProfile(BaseModel):
    age: int = Field(ge=18)
    gender: str
    education_level: str
    experience_years: int = Field(ge=0)
    desired_job: str


class JobOrderRecommendation(BaseModel):
    job_order: JobOrderResponse
    score: int
