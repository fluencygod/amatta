from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict
from uuid import uuid4
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db


class EventIn(BaseModel):
    # Core (existing)
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

    # Extended (allow richer schema; optional for backward-compat)
    event_id: Optional[str] = None
    event_time: Optional[datetime] = None
    event_name: Optional[str] = None
    client_version: Optional[str] = None
    device_type: Optional[str] = None
    duration_sec: Optional[int] = None
    current_url: Optional[str] = None

    # Accept and pass-through any extra keys
    model_config = ConfigDict(extra="allow")


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
        data = e.dict()  # includes extras via model_config
        # Normalize timestamps and naming
        data.setdefault("ts", datetime.utcnow())
        if isinstance(data.get("ts"), datetime):
            data["ts"] = data["ts"].isoformat()
        # event_time/event_name aliases for analytics pipelines
        data.setdefault("event_time", data.get("ts"))
        data.setdefault("event_name", data.get("event"))
        # URL alias
        if "current_url" not in data and data.get("url"):
            data["current_url"] = data["url"]
        # Ensure event_id exists for deduplication
        data.setdefault("event_id", uuid4().hex)
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
    data.setdefault("event_time", data.get("ts"))
    data.setdefault("event_name", data.get("event"))
    if "current_url" not in data and data.get("url"):
        data["current_url"] = data["url"]
    data.setdefault("event_id", uuid4().hex)
    data.setdefault("ua", ua)
    ip = _client_ip(request)
    if ip:
        data.setdefault("ip", ip)
    ok = await _produce(request, data)
    return {"received": 1, "sent": 1 if ok else 0, "topic": settings.kafka_topic, "kafka": bool(settings.kafka_bootstrap_servers)}
