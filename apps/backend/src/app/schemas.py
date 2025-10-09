from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Articles
class ArticleOut(BaseModel):
    id: int
    site: str
    url: str
    title: str
    summary: str | None = None
    image_url: str | None = None
    category: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime

    class Config:
        from_attributes = True


# Profile
class ProfileIn(BaseModel):
    age_group: str | None = None
    gender: str | None = None
    interests: list[str] | None = None


class ProfileOut(ProfileIn):
    updated_at: datetime | None = None
