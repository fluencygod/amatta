from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import get_current_user
from ..models import Reaction, Article, User


router = APIRouter(prefix="/reactions", tags=["reactions"]) 


def _get_reaction(db: Session, user_id: int, article_id: int) -> Reaction | None:
    return (
        db.query(Reaction)
        .filter(Reaction.user_id == user_id, Reaction.article_id == article_id)
        .first()
    )


@router.get("/{article_id}")
def get_reaction(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = _get_reaction(db, current_user.id, article_id)
    return {"reaction": (rec.kind if rec else None)}


def _toggle(db: Session, user_id: int, article_id: int, to_kind: str):
    if to_kind not in ("like", "dislike"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reaction kind")
    # ensure article exists
    art = db.get(Article, article_id)
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    rec = _get_reaction(db, user_id, article_id)
    if rec and rec.kind == to_kind:
        # toggle off (remove)
        db.delete(rec)
        db.commit()
        return None
    elif rec:
        # update kind
        rec.kind = to_kind
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec
    else:
        new_rec = Reaction(user_id=user_id, article_id=article_id, kind=to_kind)
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        return new_rec


@router.post("/like/{article_id}")
def toggle_like(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = _toggle(db, current_user.id, article_id, "like")
    return {"like": bool(rec and rec.kind == "like"), "dislike": bool(rec and rec.kind == "dislike")}


@router.post("/dislike/{article_id}")
def toggle_dislike(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = _toggle(db, current_user.id, article_id, "dislike")
    return {"like": bool(rec and rec.kind == "like"), "dislike": bool(rec and rec.kind == "dislike")}


@router.delete("/{article_id}")
def clear_reaction(article_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = _get_reaction(db, current_user.id, article_id)
    if rec:
        db.delete(rec)
        db.commit()
    return {"reaction": None}

