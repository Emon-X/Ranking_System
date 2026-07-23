from __future__ import annotations
import logging

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from app.models.participant import Participant
from app.models.contest import Contest
from app.models.participant import Participant
from app.services.vjudge import scrape_vjudge_contest
    



class RankServiceError(RuntimeError):
    pass


@dataclass(slots=True)
class ParticipantSolvedCount:
    participant_id: int
    name: str
    codeforces_handle: str | None
    atcoder_handle: str | None
    codeforces_solved_last_7_days: int
    atcoder_solved_last_7_days: int
    total_solved_last_7_days: int


@dataclass(slots=True)
class ParticipantWeeklyScore(ParticipantSolvedCount):
    contest_solved_count: int
    weekly_contest_solved_problem: int
    max_solved_problem: int
    codeforces_rating: float
    atcoder_rating: float
    weekly_contest_point: float
    weekly_points: int


@dataclass(slots=True)
class ContestWeeklyScoreUpdate:
	username: str
	weekly_points: int


def _utc_cutoff_timestamp(days: int = 30) -> int:
    return int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())


def _normalize_handle(handle: str | None) -> str | None:
    if handle is None:
        return None

    normalized = handle.strip()
    return normalized or None


def _submission_problem_key(submission: dict[str, Any]) -> str:
    problem = submission.get("problem") or {}
    contest_id = problem.get("contestId")
    index = problem.get("index")
    name = problem.get("name") or ""
    return f"{contest_id}:{index}:{name}"

_CODEFORCES_SEMAPHORE = asyncio.Semaphore(2)

async def _codeforces_get(url: str, params: dict | None = None) -> Any:
    async with _CODEFORCES_SEMAPHORE:
        await asyncio.sleep(0.5)
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            for attempt in range(3):
                try:
                    response = await client.get(url, params=params)
                    if response.status_code in (429, 403, 503) or (response.status_code == 400 and "limit" in response.text.lower()):
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    if attempt == 2 or (e.response.status_code not in (429, 403, 503) and not (e.response.status_code == 400 and "limit" in e.response.text.lower())):
                        raise e
                    await asyncio.sleep(2.0 * (attempt + 1))
                except httpx.HTTPError as e:
                    if attempt == 2:
                        raise e
                    await asyncio.sleep(2.0 * (attempt + 1))
    return None



def calculate_weekly_points(
    codeforces_solved_count: int,
    atcoder_solved_count: int,
    contest_solved_count: int = 0,
    codeforces_rating: float = 0.0,
    atcoder_rating: float = 0.0,
    weekly_contest_solved_problem: int = 0,
    max_solved_problem: int = 1,
) -> tuple[float, int]:
    problem_count = codeforces_solved_count + atcoder_solved_count + contest_solved_count
    weekly_contest_point = 0.0
    if max_solved_problem > 0:
        weekly_contest_point = (weekly_contest_solved_problem / max_solved_problem) * 50

    total_point = problem_count + (codeforces_rating / 1600.0) * 15 + (atcoder_rating / 600.0) * 10 + weekly_contest_point * 0.25
    return total_point, int(round(total_point))


def calculate_weekly_points_from_contest_solve(solves: int, max_solved_problem: int) -> int:
    if max_solved_problem <= 0:
        return 0

    weekly_contest_point = (solves / max_solved_problem) * 50
    return int(round(weekly_contest_point * 0.25))


async def fetch_codeforces_solved_count(handle: str) -> int:
    handle = _normalize_handle(handle)
    if not handle:
        return 0

    params = {
        "handle": handle,
        "from": 1,
        "count": 100000,
    }
    cutoff_timestamp = _utc_cutoff_timestamp()

    try:
        payload = await _codeforces_get("https://codeforces.com/api/user.status", params=params)
        if not isinstance(payload, dict) or payload.get("status") != "OK":
            return 0

        solved_problems: set[str] = set()
        for submission in payload.get("result") or []:
            if not isinstance(submission, dict):
                continue
            if submission.get("verdict") != "OK":
                continue
            if int(submission.get("creationTimeSeconds") or 0) < cutoff_timestamp:
                continue
            solved_problems.add(_submission_problem_key(submission))

        return len(solved_problems)
    except Exception as exc:
        logger.error(f"Codeforces solved count fetch failed for {handle}: {exc}")
        return 0


async def fetch_atcoder_solved_count(handle: str) -> int:
    handle = _normalize_handle(handle)
    if not handle:
        return 0

    cutoff_timestamp = _utc_cutoff_timestamp()
    params = {
        "user": handle,
        "from_second": cutoff_timestamp,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get("https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions", params=params)
            response.raise_for_status()

        payload = response.json()
        if not isinstance(payload, list):
            return 0

        solved_problems: set[str] = set()
        for submission in payload:
            if not isinstance(submission, dict):
                continue
            if submission.get("result") != "AC":
                continue
            if int(submission.get("epoch_second") or 0) < cutoff_timestamp:
                continue
            problem_id = str(submission.get("problem_id") or "").strip()
            if problem_id:
                solved_problems.add(problem_id)

        return len(solved_problems)
    except Exception as exc:
        logger.error(f"AtCoder solved count fetch failed for {handle}: {exc}")
        return 0


async def fetch_codeforces_rating(handle: str) -> float:
    handle = _normalize_handle(handle)
    if not handle:
        return 0.0
    
    try:
        payload = await _codeforces_get(f"https://codeforces.com/api/user.info?handles={handle}")
        if payload and isinstance(payload, dict) and payload.get("status") == "OK" and payload.get("result"):
            return float(payload["result"][0].get("rating", 0.0))
    except Exception as exc:
        logger.error(f"Codeforces rating fetch failed for {handle}: {exc}")
    return 0.0


_ATCODER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://atcoder.jp/",
}

async def fetch_atcoder_rating(handle: str) -> float:
    handle = _normalize_handle(handle)
    if not handle:
        return 0.0

    url = f"https://atcoder.jp/users/{handle}/history/json"
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=_ATCODER_HEADERS) as client:
        try:
            response = await client.get(url)
            # আগে raw status + snippet log করুন, তারপর raise
            logger.info(f"AtCoder rating fetch {handle}: status={response.status_code}")
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")
            if "json" not in content_type:
                # AtCoder bot-check বা Cloudflare HTML page ফেরত দিলে এটা ধরা পড়বে
                logger.error(
                    f"AtCoder returned non-JSON for {handle}: "
                    f"content-type={content_type}, body[:200]={response.text[:200]!r}"
                )
                return 0.0

            payload = response.json()
            if isinstance(payload, list) and payload:
                return float(payload[-1].get("NewRating", 0.0))
            logger.warning(f"AtCoder history empty for handle={handle}")
        except httpx.HTTPStatusError as e:
            logger.error(
                f"AtCoder rating fetch failed for {handle}: "
                f"status={e.response.status_code}, body[:200]={e.response.text[:200]!r}"
            )
        except Exception as e:
            logger.error(f"AtCoder rating fetch failed for {handle}: {e}")
    return 0.0

async def fetch_participant_solved_counts(participant: Any) -> ParticipantSolvedCount:
    codeforces_handle = _normalize_handle(getattr(participant, "codeforces_handle", None))
    atcoder_handle = _normalize_handle(getattr(participant, "atcoder_handle", None))

    codeforces_solved = 0
    atcoder_solved = 0

    tasks: list[tuple[str, Any]] = []
    if codeforces_handle:
        tasks.append(("codeforces", fetch_codeforces_solved_count(codeforces_handle)))
    if atcoder_handle:
        tasks.append(("atcoder", fetch_atcoder_solved_count(atcoder_handle)))

    if tasks:
        platforms = [platform for platform, _ in tasks]
        counts = await asyncio.gather(*(task for _, task in tasks))
        results = dict(zip(platforms, counts, strict=False))
        codeforces_solved = int(results.get("codeforces", 0))
        atcoder_solved = int(results.get("atcoder", 0))

    participant_name = str(getattr(participant, "name", "Unknown") or "Unknown")
    participant_id = int(getattr(participant, "id", 0) or 0)
    return ParticipantSolvedCount(
        participant_id=participant_id,
        name=participant_name,
        codeforces_handle=codeforces_handle,
        atcoder_handle=atcoder_handle,
        codeforces_solved_last_7_days=codeforces_solved,
        atcoder_solved_last_7_days=atcoder_solved,
        total_solved_last_7_days=codeforces_solved + atcoder_solved,
    )


async def fetch_participant_weekly_score(participant: Any) -> ParticipantWeeklyScore:
    solved_counts = await fetch_participant_solved_counts(participant)
    
    codeforces_rating = 0.0
    atcoder_rating = 0.0
    
    rating_tasks: list[tuple[str, Any]] = []
    if solved_counts.codeforces_handle:
        rating_tasks.append(("codeforces", fetch_codeforces_rating(solved_counts.codeforces_handle)))
    if solved_counts.atcoder_handle:
        rating_tasks.append(("atcoder", fetch_atcoder_rating(solved_counts.atcoder_handle)))
        
    if rating_tasks:
        platforms = [platform for platform, _ in rating_tasks]
        ratings = await asyncio.gather(*(task for _, task in rating_tasks))
        results = dict(zip(platforms, ratings, strict=False))
        codeforces_rating = results.get("codeforces", 0.0)
        atcoder_rating = results.get("atcoder", 0.0)
    
    contest_solved_count = int(getattr(participant, "contest_solved_count", 0) or 0)
    weekly_contest_solved_problem = int(getattr(participant, "weekly_contest_solved_problem", 0) or 0)
    max_solved_problem = int(getattr(participant, "max_solved_problem", 0) or 0)
    
    total_point, weekly_points = calculate_weekly_points(
        solved_counts.codeforces_solved_last_7_days,
        solved_counts.atcoder_solved_last_7_days,
        contest_solved_count=contest_solved_count,
        codeforces_rating=codeforces_rating,
        atcoder_rating=atcoder_rating,
        weekly_contest_solved_problem=weekly_contest_solved_problem,
        max_solved_problem=max_solved_problem,
    )
    weekly_contest_point = 0.0
    if max_solved_problem > 0:
        weekly_contest_point = (weekly_contest_solved_problem / max_solved_problem) * 50
    return ParticipantWeeklyScore(
        participant_id=solved_counts.participant_id,
        name=solved_counts.name,
        codeforces_handle=solved_counts.codeforces_handle,
        atcoder_handle=solved_counts.atcoder_handle,
        codeforces_solved_last_7_days=solved_counts.codeforces_solved_last_7_days,
        atcoder_solved_last_7_days=solved_counts.atcoder_solved_last_7_days,
        total_solved_last_7_days=solved_counts.total_solved_last_7_days,
        contest_solved_count=contest_solved_count,
        weekly_contest_solved_problem=weekly_contest_solved_problem,
        max_solved_problem=max_solved_problem,
        codeforces_rating=codeforces_rating,
        atcoder_rating=atcoder_rating,
        weekly_contest_point=weekly_contest_point,
        weekly_points=weekly_points,
    )


async def fetch_participants_solved_counts(participants: list[Any]) -> list[ParticipantSolvedCount]:
    if not participants:
        return []

    return await asyncio.gather(*(fetch_participant_solved_counts(participant) for participant in participants))


async def fetch_participants_weekly_scores(participants: list[Any]) -> list[ParticipantWeeklyScore]:
	if not participants:
		return []

	return await asyncio.gather(*(fetch_participant_weekly_score(participant) for participant in participants))


def build_contest_weekly_score_updates(contests: list[Any], participants: list[Any]) -> list[ContestWeeklyScoreUpdate]:
    participant_by_handle: dict[str, Any] = {}
    for participant in participants:
        username = str(getattr(participant, "username", "") or "").strip()
        vjudge_handle = str(getattr(participant, "vjudge_handle", "") or "").strip()

        if username:
            participant_by_handle[username] = participant
        if vjudge_handle:
            participant_by_handle[vjudge_handle] = participant

    contest_entries: dict[str, int] = {}
    for contest in contests:
        for contestant in getattr(contest, "contestants", []) or []:
            username = str(getattr(contestant, "vjudge_handle", "") or "").strip()
            if not username:
                username = str(getattr(contestant, "contestant", "") or "").strip()
            if not username:
                continue
            contest_entries[username] = max(contest_entries.get(username, 0), int(getattr(contestant, "solves", 0) or 0))

    max_solved_problem = max(contest_entries.values(), default=0)
    updates: list[ContestWeeklyScoreUpdate] = []
    for username, solves in contest_entries.items():
        participant = participant_by_handle.get(username)
        if not participant:
            continue
        weekly_points = calculate_weekly_points_from_contest_solve(solves, max_solved_problem)
        updates.append(ContestWeeklyScoreUpdate(username=str(getattr(participant, "username", "") or ""), weekly_points=weekly_points))

    return updates


logger = logging.getLogger(__name__)

async def recalculate_all_users_standings(db: Any):
    import json
    
    participants = db.query(Participant).all()
    if not participants:
        return
        
    try:
        scores = await fetch_participants_weekly_scores(participants)
    except Exception as e:
        logger.error(f"Error fetching weekly scores in recalculate: {e}")
        return
        
    score_by_participant_id = {score.participant_id: score for score in scores}
    for p in participants:
        score = score_by_participant_id.get(p.id)
        if score:
            p.codeforces_solved_last_7_days = score.codeforces_solved_last_7_days
            p.atcoder_solved_last_7_days = score.atcoder_solved_last_7_days
            p.total_solved_last_7_days = score.total_solved_last_7_days
            p.codeforces_rating = int(score.codeforces_rating)
            p.atcoder_rating = int(score.atcoder_rating)
            p.weekly_contest_point = score.weekly_contest_point
            p.weekly_points = score.weekly_points
            
    db.commit()
    
    sorted_participants = db.query(Participant).order_by(
        Participant.weekly_points.desc(),
        Participant.codeforces_rating.desc(),
        Participant.atcoder_rating.desc(),
        Participant.total_solved_last_7_days.desc()
    ).all()
    for index, p in enumerate(sorted_participants):
        rank = index + 1
        p.weekly_position = rank
        
        try:
            history = json.loads(p.weekly_positions_history or "[]")
        except Exception:
            history = []
        if not isinstance(history, list):
            history = []
            
        history.append(rank)
        p.weekly_positions_history = json.dumps(history)
        
    db.commit()


async def check_and_process_finished_contests(db: Any):
   
    now = datetime.utcnow()
    # Sort unprocessed by scheduled_at desc to find the latest ones first
    unprocessed = db.query(Contest).filter(
        Contest.scheduled_at != None,
        Contest.processed == False
    ).order_by(Contest.scheduled_at.desc()).all()
    
    contest_to_process = None
    
    for contest in unprocessed:
        end_time = contest.scheduled_at + timedelta(seconds=contest.duration_seconds or 7200)
        if now >= end_time:
            contest_to_process = contest
            break
            
    if not contest_to_process:
        return
            
    try:
        logger.info(f"Processing finished contest: {contest_to_process.name} ({contest_to_process.vjudge_url})")
        scraped = await scrape_vjudge_contest(contest_to_process.vjudge_url)
        
        if scraped.contest_name and not contest_to_process.name:
            contest_to_process.name = scraped.contest_name
            
        participants = db.query(Participant).all()
        participant_by_handle = {}
        for p in participants:
            u = str(p.username or "").strip().lower()
            vh = str(p.vjudge_handle or "").strip().lower()
            if u:
                participant_by_handle[u] = p
            if vh:
                participant_by_handle[vh] = p
                
        solves_list = [c.solves for c in scraped.contestants]
        max_solves = max(solves_list) if solves_list else 0
        
        scraped_solves_by_handle = {}
        for c in scraped.contestants:
            display_name = str(c.contestant or "")
            handles = []
            if "(" in display_name and display_name.endswith(")"):
                name_part = display_name[:display_name.find("(")].strip().lower()
                nickname_part = display_name[display_name.find("(")+1:-1].strip().lower()
                handles.extend([name_part, nickname_part])
            else:
                handles.append(display_name.strip().lower())
                
            if c.vjudge_handle:
                handles.append(str(c.vjudge_handle).strip().lower())
                
            for h in handles:
                if h:
                    scraped_solves_by_handle[h] = c.solves
                    
        for p in participants:
            solves = 0
            p_u = str(p.username or "").strip().lower()
            p_vh = str(p.vjudge_handle or "").strip().lower()
            
            if p_vh in scraped_solves_by_handle:
                solves = scraped_solves_by_handle[p_vh]
            elif p_u in scraped_solves_by_handle:
                solves = scraped_solves_by_handle[p_u]
                
            p.weekly_contest_solved_problem = solves
            p.max_solved_problem = max_solves
            p.contest_solved_count = (p.contest_solved_count or 0) + solves
            
        contest_to_process.processed = True
        db.commit()
        
    except Exception as e:
        logger.error(f"Failed to process finished contest {contest_to_process.vjudge_url}: {e}")
        
    await recalculate_all_users_standings(db)


async def update_new_user_with_latest_contest(db: Any, new_user: Participant):
    now = datetime.utcnow()
    contests = db.query(Contest).filter(
        Contest.scheduled_at != None
    ).order_by(Contest.scheduled_at.desc()).all()
    
    latest_past_contest = None
    for contest in contests:
        if contest.scheduled_at:
            end_time = contest.scheduled_at + timedelta(seconds=contest.duration_seconds or 7200)
            if now >= end_time:
                latest_past_contest = contest
                break
                
    if not latest_past_contest or not latest_past_contest.vjudge_url:
        return
        
    try:
        scraped = await scrape_vjudge_contest(latest_past_contest.vjudge_url)
        solves_list = [c.solves for c in scraped.contestants]
        max_solves = max(solves_list) if solves_list else 0
        
        solves = 0
        p_u = str(new_user.username or "").strip().lower()
        p_vh = str(new_user.vjudge_handle or "").strip().lower()
        
        for c in scraped.contestants:
            display_name = str(c.contestant or "")
            handles = []
            if "(" in display_name and display_name.endswith(")"):
                handles.append(display_name[:display_name.find("(")].strip().lower())
                handles.append(display_name[display_name.find("(")+1:-1].strip().lower())
            else:
                handles.append(display_name.strip().lower())
                
            if c.vjudge_handle:
                handles.append(str(c.vjudge_handle).strip().lower())
                
            if (p_vh and p_vh in handles) or (p_u and p_u in handles):
                solves = c.solves
                break
                
        new_user.weekly_contest_solved_problem = solves
        new_user.max_solved_problem = max_solves
        new_user.contest_solved_count = (new_user.contest_solved_count or 0) + solves
        
        db.commit()
    except Exception as e:
        logger.error(f"Failed to fetch latest contest for new user: {e}")
