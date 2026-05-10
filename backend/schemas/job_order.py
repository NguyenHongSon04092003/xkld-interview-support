from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from models.job_order import JobOrderStatus


class JobOrderBase(BaseModel):
    job_name: str
    company_name: str
    status: JobOrderStatus
    job_position: Optional[str] = None
    salary: Optional[Decimal] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    location: Optional[str] = None
    quantity: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_requirement: Optional[str] = None
    education_level: Optional[str] = None
    experience_required: Optional[str] = None
    job_description: Optional[str] = None
    interview_requirement: Optional[str] = None

    @field_validator("gender_requirement")
    @classmethod
    def validate_gender_requirement(cls, value: Optional[str]) -> Optional[str]:
        allowed_values = {"Nam", "Nữ", "Nam/Nữ", "Không yêu cầu"}
        if value is not None and value not in allowed_values:
            raise ValueError("Giới tính yêu cầu không hợp lệ")
        return value

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, value: Optional[str]) -> Optional[str]:
        allowed_values = {
            "Trung học phổ thông",
            "Cao đẳng",
            "Đại học",
            "Không yêu cầu",
        }
        if value is not None and value not in allowed_values:
            raise ValueError("Trình độ học vấn không hợp lệ")
        return value

    @field_validator(
        "salary",
        "salary_min",
        "salary_max",
        "quantity",
        "age_min",
        "age_max",
    )
    @classmethod
    def validate_non_negative_number(cls, value):
        if value is not None and value < 0:
            raise ValueError("Giá trị số không được âm")
        return value

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Số lượng tuyển phải lớn hơn hoặc bằng 0")
        return value

    @field_validator("age_min")
    @classmethod
    def validate_age_min(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 18:
            raise ValueError("Tuổi tối thiểu phải lớn hơn hoặc bằng 18")
        return value

    @field_validator("experience_required")
    @classmethod
    def validate_experience_required(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value == "":
            return value

        try:
            years = float(value)
        except ValueError as exc:
            raise ValueError("Số năm kinh nghiệm phải là số") from exc

        if years < 0:
            raise ValueError("Số năm kinh nghiệm phải lớn hơn hoặc bằng 0")
        return value

    @model_validator(mode="after")
    def validate_ranges(self):
        if (
            self.age_min is not None
            and self.age_max is not None
            and self.age_max < self.age_min
        ):
            raise ValueError("Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu")

        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu")

        return self


class JobOrderCreate(JobOrderBase):
    pass


class JobOrderUpdate(BaseModel):
    job_name: Optional[str] = None
    company_name: Optional[str] = None
    status: Optional[JobOrderStatus] = None
    job_position: Optional[str] = None
    salary: Optional[Decimal] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    location: Optional[str] = None
    quantity: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_requirement: Optional[str] = None
    education_level: Optional[str] = None
    experience_required: Optional[str] = None
    job_description: Optional[str] = None
    interview_requirement: Optional[str] = None

    @field_validator("gender_requirement")
    @classmethod
    def validate_gender_requirement(cls, value: Optional[str]) -> Optional[str]:
        allowed_values = {"Nam", "Nữ", "Nam/Nữ", "Không yêu cầu"}
        if value is not None and value not in allowed_values:
            raise ValueError("Giới tính yêu cầu không hợp lệ")
        return value

    @field_validator("education_level")
    @classmethod
    def validate_education_level(cls, value: Optional[str]) -> Optional[str]:
        allowed_values = {
            "Trung học phổ thông",
            "Cao đẳng",
            "Đại học",
            "Không yêu cầu",
        }
        if value is not None and value not in allowed_values:
            raise ValueError("Trình độ học vấn không hợp lệ")
        return value

    @field_validator(
        "salary",
        "salary_min",
        "salary_max",
        "quantity",
        "age_min",
        "age_max",
    )
    @classmethod
    def validate_non_negative_number(cls, value):
        if value is not None and value < 0:
            raise ValueError("Giá trị số không được âm")
        return value

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 0:
            raise ValueError("Số lượng tuyển phải lớn hơn hoặc bằng 0")
        return value

    @field_validator("age_min")
    @classmethod
    def validate_age_min(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value < 18:
            raise ValueError("Tuổi tối thiểu phải lớn hơn hoặc bằng 18")
        return value

    @field_validator("experience_required")
    @classmethod
    def validate_experience_required(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value == "":
            return value

        try:
            years = float(value)
        except ValueError as exc:
            raise ValueError("Số năm kinh nghiệm phải là số") from exc

        if years < 0:
            raise ValueError("Số năm kinh nghiệm phải lớn hơn hoặc bằng 0")
        return value

    @model_validator(mode="after")
    def validate_ranges(self):
        if (
            self.age_min is not None
            and self.age_max is not None
            and self.age_max < self.age_min
        ):
            raise ValueError("Tuổi tối đa phải lớn hơn hoặc bằng tuổi tối thiểu")

        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("Mức lương tối đa phải lớn hơn hoặc bằng mức lương tối thiểu")

        return self


class JobOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_name: str
    company_name: str
    status: JobOrderStatus
    job_position: Optional[str] = None
    salary: Optional[Decimal] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    location: Optional[str] = None
    quantity: Optional[int] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender_requirement: Optional[str] = None
    education_level: Optional[str] = None
    experience_required: Optional[str] = None
    job_description: Optional[str] = None
    interview_requirement: Optional[str] = None
    id: int
    created_at: datetime
    updated_at: datetime
