import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from database import test_database_connection
from routers import admin
from routers import auth
from routers import interview_question
from routers import job_order
from routers import mock_interview
from routers import recommendation
from routers import scoring

app = FastAPI()


def get_allowed_origins() -> list[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    configured_origins = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_URL", "")
    origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    return [*default_origins, *origins]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_order.router, prefix="/api")
app.include_router(interview_question.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(recommendation.router, prefix="/api")
app.include_router(mock_interview.router, prefix="/api")
app.include_router(scoring.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.on_event("startup")
def startup_event():
    try:
        test_database_connection()
        print("Database connected successfully")
    except SQLAlchemyError as exc:
        print(f"Database connection failed: {exc}")


@app.get("/")
def root():
    return {"message": "XKLD Backend is running"}
