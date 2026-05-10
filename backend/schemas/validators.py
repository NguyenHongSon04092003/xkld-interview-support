import re
from typing import Optional


PHONE_PATTERN = re.compile(r"^\+?\d{8,15}$")


def normalize_email(value: str) -> str:
    return value.strip().lower()


def normalize_full_name(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if len(normalized) < 2:
        raise ValueError("Full name is too short")
    return normalized


def normalize_password(value: str) -> str:
    if len(value) < 6:
        raise ValueError("Password must be at least 6 characters")
    return value


def normalize_phone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    normalized = value.replace(" ", "").replace("-", "").replace(".", "")
    if not normalized:
        return None

    if not PHONE_PATTERN.match(normalized):
        raise ValueError("Phone number is invalid")
    return normalized
