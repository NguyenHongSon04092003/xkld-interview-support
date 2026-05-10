from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import SessionLocal
from models.user import User, UserRole
from schemas.user import Token, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
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
        role=UserRole.candidate,
        phone=payload.phone,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if user is None or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
