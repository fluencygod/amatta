from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import get_current_user
from ..models import Bookmark, Article, User
from .. import schemas


router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("/", response_model=List[schemas.ArticleOut])
def list_bookmarks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # join to articles and return recent first
    q = (
        db.query(Article)
        .join(Bookmark, Bookmark.article_id == Article.id)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    return q.all()


@router.get("/has/{article_id}")
def has_bookmark(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.article_id == article_id).first() is not None
    return {"bookmarked": exists}


@router.post("/{article_id}")
def add_bookmark(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # ensure article exists
    art = db.get(Article, article_id)
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    exists = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.article_id == article_id).first()
    if not exists:
        db.add(Bookmark(user_id=current_user.id, article_id=article_id))
        db.commit()
    return {"bookmarked": True}


@router.delete("/{article_id}")
def remove_bookmark(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bk = db.query(Bookmark).filter(Bookmark.user_id == current_user.id, Bookmark.article_id == article_id).first()
    if bk:
        db.delete(bk)
        db.commit()
    return {"bookmarked": False}

