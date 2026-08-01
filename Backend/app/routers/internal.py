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


@router.get("/participants")
def get_participants(
    db: Session = Depends(get_db),
    _: None = Depends(verify_internal_secret),
):
    participants = db.query(Participant).all()
    return {
        "participants": [
            {
                "id": p.id,
                "username": p.username,
                "codeforces_handle": p.codeforces_handle,
                "atcoder_handle": p.atcoder_handle,
                "weekly_contest_solved_problem": p.weekly_contest_solved_problem or 0,
                "max_solved_problem": p.max_solved_problem or 0,
                "contest_solved_count": p.contest_solved_count or 0,
            }
            for p in participants
        ]
    }


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


@router.post("/sync-stats")
def update_all_sync_stats(
    payload: dict,
    db: Session = Depends(get_db),
    _: None = Depends(verify_internal_secret),
):
    from app.services.rank import calculate_weekly_points, update_all_ranks_in_db
    
    stats_list = payload.get("stats", [])
    updated = 0
    
    for item in stats_list:
        p_id = item.get("id")
        p = db.query(Participant).filter(Participant.id == p_id).first()
        if not p:
            continue
            
        cf_rating = float(item.get("codeforces_rating", p.codeforces_rating or 0))
        ac_rating = float(item.get("atcoder_rating", p.atcoder_rating or 0))
        cf_solved = int(item.get("codeforces_solved_last_7_days", p.codeforces_solved_last_7_days or 0))
        ac_solved = int(item.get("atcoder_solved_last_7_days", p.atcoder_solved_last_7_days or 0))
        
        p.codeforces_rating = int(cf_rating)
        p.atcoder_rating = int(ac_rating)
        p.codeforces_solved_last_7_days = cf_solved
        p.atcoder_solved_last_7_days = ac_solved
        p.total_solved_last_7_days = cf_solved + ac_solved
        
        total_point, weekly_points = calculate_weekly_points(
            cf_solved,
            ac_solved,
            contest_solved_count=p.contest_solved_count or 0,
            codeforces_rating=cf_rating,
            atcoder_rating=ac_rating,
            weekly_contest_solved_problem=p.weekly_contest_solved_problem or 0,
            max_solved_problem=p.max_solved_problem or 0,
        )
        
        p.weekly_contest_point = total_point
        p.weekly_points = weekly_points
        updated += 1

    db.commit()
    update_all_ranks_in_db(db)
    return {"status": "ok", "updated_count": updated}