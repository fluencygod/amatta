from __future__ import annotations

import json
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..security import get_current_user
from ..models import Profile, User
from .. import schemas


router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=schemas.ProfileOut)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not p:
        return schemas.ProfileOut(age_group=None, gender=None, interests=None, updated_at=None)
    interests = None
    if p.interests_json:
        try:
            interests = json.loads(p.interests_json)
        except Exception:
            interests = None
    return schemas.ProfileOut(age_group=p.age_group, gender=p.gender, interests=interests, updated_at=p.updated_at)


@router.post("/me", response_model=schemas.ProfileOut)
def upsert_my_profile(payload: schemas.ProfileIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    now = datetime.utcnow()
    interests_json = json.dumps(payload.interests or []) if payload.interests is not None else None
    if p:
        p.age_group = payload.age_group
        p.gender = payload.gender
        p.interests_json = interests_json
        p.updated_at = now
    else:
        p = Profile(user_id=current_user.id, age_group=payload.age_group, gender=payload.gender, interests_json=interests_json, updated_at=now)
        db.add(p)
    db.commit()
    return schemas.ProfileOut(age_group=p.age_group, gender=p.gender, interests=payload.interests or [], updated_at=p.updated_at)

