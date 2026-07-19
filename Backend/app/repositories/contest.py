from app.database.db import session_local
from app.models.contest import Contest
from app.schemas.contest_store import ContestCreateRequest
from sqlalchemy.orm import Session


class ContestRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[Contest]:
        return self.db.query(Contest).order_by(Contest.scheduled_at.asc().nullslast()).all()

    def get_by_url(self, url: str) -> Contest | None:
        return self.db.query(Contest).filter(Contest.vjudge_url == url).first()

    def create(self, payload: ContestCreateRequest) -> Contest:
        c = Contest(
            name=payload.name,
            vjudge_url=payload.vjudge_url,
            scheduled_at=payload.scheduled_at,
            is_rated=payload.is_rated,
            duration_seconds=payload.duration_seconds or 7200,
        )
        self.db.add(c)
        self.db.commit()
        self.db.refresh(c)
        return c
