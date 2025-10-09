from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Article
from .. import schemas


router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("/", response_model=List[schemas.ArticleOut])
def list_articles(
    db: Session = Depends(get_db),
    q: Optional[str] = Query(None, description="검색어(제목/요약)"),
    site: Optional[str] = Query(None, description="언론사 필터(사이트명 substring)"),
    date_from: Optional[datetime] = Query(None, description="시작일(포함), ISO8601"),
    date_to: Optional[datetime] = Query(None, description="종료일(포함), ISO8601"),
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order: str = Query("published_desc", description="published_desc|fetched_desc"),
):
    qset = db.query(Article)
    if q:
        like = f"%{q}%"
        qset = qset.filter(or_(Article.title.ilike(like), Article.summary.ilike(like)))
    if site:
        qset = qset.filter(Article.site.ilike(f"%{site}%"))
    if date_from:
        qset = qset.filter(Article.published_at >= date_from)
    if date_to:
        qset = qset.filter(Article.published_at <= date_to)

    if order == "fetched_desc":
        qset = qset.order_by(Article.fetched_at.desc())
    else:
        qset = qset.order_by(Article.published_at.desc().nullslast(), Article.fetched_at.desc())

    items = qset.offset(offset).limit(limit).all()
    return items


@router.get("/{article_id}", response_model=schemas.ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db)):
    art = db.query(Article).filter(Article.id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
    return art

