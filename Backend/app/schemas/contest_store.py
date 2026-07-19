from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional


class ContestCreateRequest(BaseModel):
    name: str | None = None
    vjudge_url: str
    scheduled_at: datetime | None = None
    is_rated: bool = True
    duration_seconds: int | None = 7200


class ContestOut(BaseModel):
    id: int
    name: str | None = None
    vjudge_url: str
    scheduled_at: datetime | None = None
    is_rated: bool
    duration_seconds: int
    processed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ContestListResponse(BaseModel):
    upcoming: list[ContestOut]
    running: list[ContestOut]
    past: list[ContestOut]
