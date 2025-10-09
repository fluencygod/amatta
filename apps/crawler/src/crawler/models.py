from __future__ import annotations

from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Text,
    Index,
    UniqueConstraint,
    Column,
)

from .db import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True)
    site = Column(String(80), index=True, nullable=False)
    url = Column(String(1024), unique=True, nullable=False)
    title = Column(String(512), nullable=False)
    summary = Column(Text())
    content = Column(Text())
    author = Column(String(255))
    category = Column(String(255))
    image_url = Column(String(1024))
    published_at = Column(DateTime(timezone=False))
    fetched_at = Column(DateTime(timezone=False), default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_articles_site_fetched", "site", "fetched_at"),
        UniqueConstraint("url", name="uq_articles_url"),
    )


class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(Integer, primary_key=True)
    site = Column(String(80), index=True, nullable=False)
    run_at = Column(DateTime(timezone=False), default=datetime.utcnow, nullable=False, index=True)
    status = Column(String(20), default="ok")  # ok|error
    saved = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    message = Column(Text())
