import os
from contextlib import contextmanager
from datetime import datetime
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# SQLAlchemy 1.4/2.0 compatibility for Base
try:  # SQLAlchemy 2.0+
    from sqlalchemy.orm import DeclarativeBase  # type: ignore

    class Base(DeclarativeBase):  # type: ignore
        pass
except Exception:  # SQLAlchemy 1.4 fallback
    from sqlalchemy.orm import declarative_base  # type: ignore

    Base = declarative_base()  # type: ignore


def db_url() -> str:
    return (
        os.getenv("CRAWLER_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or "mysql+pymysql://user:password@localhost:3306/newsdb"
    )


engine = create_engine(db_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
