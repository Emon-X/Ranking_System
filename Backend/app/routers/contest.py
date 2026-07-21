from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.schemas.contest import ContestScrapeRequest, ContestScrapeResponse, ContestantStanding, ScrapedContestResponse
from app.schemas.contest_store import ContestCreateRequest, ContestListResponse, ContestOut
from app.services.vjudge import VJudgeScrapeError, scrape_vjudge_contests
from app.repositories.participant import ParticipantRepository
from app.repositories.contest import ContestRepository
from app.services.rank import build_contest_weekly_score_updates
from app.database.db import get_db, session_local
from app.core.dependencis import get_current_user


router = APIRouter(prefix="/contests", tags=["contests"])


from datetime import timedelta
from app.services.rank import check_and_process_finished_contests
import asyncio

def run_process_contests_task():
    async def _async_task():
        db = session_local()
        try:
            await check_and_process_finished_contests(db)
        finally:
            db.close()
    
    asyncio.run(_async_task())

@router.get("/list", response_model=ContestListResponse)
async def list_contests(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Return all stored contests; frontend splits upcoming, running vs past."""
    background_tasks.add_task(run_process_contests_task)
    
    contests = ContestRepository(db).get_all()
    now = datetime.utcnow()
    
    upcoming = []
    running = []
    past = []
    
    for c in contests:
        if not c.scheduled_at:
            past.append(ContestOut.model_validate(c))
            continue
            
        end_time = c.scheduled_at + timedelta(seconds=c.duration_seconds or 7200)
        if now < c.scheduled_at:
            upcoming.append(ContestOut.model_validate(c))
        elif c.scheduled_at <= now < end_time:
            running.append(ContestOut.model_validate(c))
        else:
            past.append(ContestOut.model_validate(c))
            
    return ContestListResponse(
        upcoming=upcoming,
        running=running,
        past=past
    )


@router.post("/add", response_model=ContestOut)
async def add_contest(payload: ContestCreateRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Save a contest link (admin only)."""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to add contests.")
    
    existing = ContestRepository(db).get_by_url(payload.vjudge_url)
    if existing:
        raise HTTPException(status_code=409, detail="Contest URL already stored.")
        
    try:
        from app.services.vjudge import scrape_vjudge_contest
        scraped = await scrape_vjudge_contest(payload.vjudge_url)
        if scraped.contest_name and not payload.name:
            payload.name = scraped.contest_name
    except Exception:
        pass
        
    contest = ContestRepository(db).create(payload)
    return ContestOut.model_validate(contest)


@router.post("/scrape", response_model=ContestScrapeResponse)
async def scrape_contest_urls(payload: ContestScrapeRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)) -> ContestScrapeResponse:
    try:
        contests = await scrape_vjudge_contests([str(url) for url in payload.urls])
    except VJudgeScrapeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to scrape contests.")

    participants = ParticipantRepository(db).get_all_participants()
    updates = build_contest_weekly_score_updates(contests, participants)
    
    participant_by_username = {participant.username: participant for participant in participants}
    for update in updates:
        participant = participant_by_username.get(update.username)
        if participant is not None:
            participant.weekly_points = update.weekly_points

    db.commit()

    return ContestScrapeResponse(
        results=[
            ScrapedContestResponse(
                contest_url=contest.contest_url,
                contest_name=contest.contest_name,
                contestants=[
                    ContestantStanding(
                        position=contestant.position,
                        contestant=contestant.contestant,
                        solves=contestant.solves,
                    )
                    for contestant in contest.contestants
                ],
            )
            for contest in contests
        ]
    )
