from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.participant import Participant
from app.database.db import get_db
import os

router = APIRouter(prefix="/internal", tags=["internal"])

INTERNAL_SECRET = os.environ["INTERNAL_SYNC_SECRET"]


def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/atcoder-handles")
def get_atcoder_handles(
    db: Session = Depends(get_db),
    _: None = Depends(verify_internal_secret),
):
    handles = (
        db.query(Participant.atcoder_handle)
        .filter(Participant.atcoder_handle.isnot(None), Participant.atcoder_handle != "")
        .distinct()
        .all()
    )
    return {"handles": [h[0].strip() for h in handles if h[0] and h[0].strip()]}


@router.post("/atcoder-ratings")
def update_atcoder_ratings(
    payload: dict[str, float],
    db: Session = Depends(get_db),
    _: None = Depends(verify_internal_secret),
):
    updated = 0
    participants = db.query(Participant).filter(Participant.atcoder_handle.isnot(None)).all()
    handle_map = {p.atcoder_handle.strip().lower(): p for p in participants if p.atcoder_handle}

    for handle, rating in payload.items():
        p = handle_map.get(handle.strip().lower())
        if p:
            p.atcoder_rating = int(rating)
            updated += 1

    db.commit()
    return {"status": "ok", "updated_count": updated}