from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Index, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str | None] = mapped_column(String(50), unique=False, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site: Mapped[str] = mapped_column(String(80), index=True)
    url: Mapped[str] = mapped_column(String(1024), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text())
    content: Mapped[str | None] = mapped_column(Text())
    author: Mapped[str | None] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(255))
    image_url: Mapped[str | None] = mapped_column(String(1024))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_articles_site_fetched_bk", "site", "fetched_at"),
        UniqueConstraint("url", name="uq_articles_url_bk"),
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: int = Column(Integer, primary_key=True)
    user_id: int = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    age_group: str | None = Column(String(50))
    gender: str | None = Column(String(20))
    interests_json: str | None = Column(Text())  # JSON string of interests
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: int = Column(Integer, primary_key=True)
    user_id: int = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    article_id: int = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_bookmarks_user_article"),
    )


class Reaction(Base):
    __tablename__ = "reactions"

    id: int = Column(Integer, primary_key=True)
    user_id: int = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    article_id: int = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), index=True, nullable=False)
    # 'like' or 'dislike'
    kind: str = Column(String(16), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "article_id", name="uq_reactions_user_article"),
    )
