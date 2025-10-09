from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db


class EventIn(BaseModel):
    event: str
    ts: Optional[datetime] = None
    user_id: Optional[int] = None
    session_id: str
    page: Optional[str] = None
    url: Optional[str] = None
    referrer: Optional[str] = None
    article_id: Optional[int] = None
    position: Optional[int] = None
    viewport: Optional[dict] = None
    meta: Optional[dict] = None


class EventBatchIn(BaseModel):
    events: List[EventIn]


router = APIRouter(prefix="/events", tags=["events"]) 


def _client_ip(request: Request) -> str | None:
    # Prefer X-Forwarded-For (first IP), then X-Real-IP, then client host
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # may be comma separated
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            return parts[0]
    xr = request.headers.get("x-real-ip")
    if xr:
        return xr
    try:
        return request.client.host if request.client else None
    except Exception:
        return None


async def _produce(request: Request, payload: dict[str, Any]) -> bool:
    if not (settings.analytics_enabled and settings.kafka_bootstrap_servers):
        return False
    producer = getattr(request.app.state, "kafka_producer", None)
    if not producer:
        return False
    try:
        key_src = str(payload.get("user_id") or payload.get("session_id") or "")
        key = key_src.encode("utf-8") if key_src else None
        await producer.send_and_wait(settings.kafka_topic, json.dumps(payload).encode("utf-8"), key=key)
        return True
    except Exception:
        return False


@router.post("/")
async def ingest_events(batch: EventBatchIn, request: Request, db: Session = Depends(get_db)):
    if not batch.events:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="empty events")
    ua = request.headers.get("user-agent")
    sent = 0
    for e in batch.events:
        data = e.dict()
        data.setdefault("ts", datetime.utcnow())
        if isinstance(data.get("ts"), datetime):
            data["ts"] = data["ts"].isoformat()
        data.setdefault("ua", ua)
        ip = _client_ip(request)
        if ip:
            data.setdefault("ip", ip)
        ok = await _produce(request, data)
        if ok:
            sent += 1
    return {"received": len(batch.events), "sent": sent, "topic": settings.kafka_topic, "kafka": bool(settings.kafka_bootstrap_servers)}


@router.post("/single")
async def ingest_single(evt: EventIn, request: Request, db: Session = Depends(get_db)):
    ua = request.headers.get("user-agent")
    data = evt.dict()
    data.setdefault("ts", datetime.utcnow())
    if isinstance(data.get("ts"), datetime):
        data["ts"] = data["ts"].isoformat()
    data.setdefault("ua", ua)
    ip = _client_ip(request)
    if ip:
        data.setdefault("ip", ip)
    ok = await _produce(request, data)
    return {"received": 1, "sent": 1 if ok else 0, "topic": settings.kafka_topic, "kafka": bool(settings.kafka_bootstrap_servers)}
