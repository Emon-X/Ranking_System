from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Optional


class ContestScrapeRequest(BaseModel):
    urls: list[HttpUrl] = Field(min_length=1)


class ContestantStanding(BaseModel):
    position: int
    contestant: str
    solves: int


class ScrapedContestResponse(BaseModel):
    contest_url: HttpUrl
    contest_name: str | None = None
    contestants: list[ContestantStanding]


class ContestScrapeResponse(BaseModel):
    results: list[ScrapedContestResponse]
