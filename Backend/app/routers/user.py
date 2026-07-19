from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from app.schemas.user import ParticipantWeeklyPointsListResponse, ParticipantWeeklyPointsResponse
from app.repositories.participant import ParticipantRepository
from app.services.rank import fetch_participants_weekly_scores, RankServiceError
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.core.dependencis import get_current_user


router = APIRouter(prefix="/users", tags=["users"])

@router.get("/ViewAllUsers_by_Rank", response_model=ParticipantWeeklyPointsListResponse)
async def view_all_users_by_rank(refresh: bool = False, db : Session = Depends(get_db), current_user = Depends(get_current_user)):
    from app.services.rank import check_and_process_finished_contests, recalculate_all_users_standings
    
    # Check and process finished contests automatically
    await check_and_process_finished_contests(db)
    
    if refresh:
        await recalculate_all_users_standings(db)
        
    participants = ParticipantRepository(db).get_all_participants()

    return ParticipantWeeklyPointsListResponse(
        participants=[
            ParticipantWeeklyPointsResponse(
                participant_id=participant.id,
                username=participant.username,
                name=participant.name,
                codeforces_handle=participant.codeforces_handle,
                atcoder_handle=participant.atcoder_handle,
                codeforces_solved_last_7_days=participant.codeforces_solved_last_7_days or 0,
                atcoder_solved_last_7_days=participant.atcoder_solved_last_7_days or 0,
                total_solved_last_7_days=participant.total_solved_last_7_days or 0,
                contest_solved_count=participant.contest_solved_count or 0,
                weekly_contest_solved_problem=participant.weekly_contest_solved_problem or 0,
                max_solved_problem=participant.max_solved_problem or 0,
                codeforces_rating=float(participant.codeforces_rating or 0),
                atcoder_rating=float(participant.atcoder_rating or 0),
                weekly_contest_point=float(participant.weekly_contest_point or 0.0),
                weekly_points=participant.weekly_points or 0,
            )
            for participant in participants
        ]
    )
    
@router.get("/ViewUser/{username}")
async def view_user(username: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    import json
    participant = ParticipantRepository(db).get_participant_by_username(username)
    
    if not participant:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        position_history = json.loads(participant.weekly_positions_history or "[]")
    except Exception:
        position_history = []
    
    return {
        "participant": {
            "id": participant.id,
            "name": participant.name,
            "username": participant.username,
            "email": participant.email,
            "role": participant.role,
            "codeforces_handle": participant.codeforces_handle,
            "atcoder_handle": participant.atcoder_handle,
            "codechef_handle": participant.codechef_handle,
            "vjudge_handle": participant.vjudge_handle,
            "weekly_points": participant.weekly_points or 0,
            "weekly_position": participant.weekly_position or 0,
            "contest_solved_count": participant.contest_solved_count or 0,
            "weekly_contest_solved_problem": participant.weekly_contest_solved_problem or 0,
            "max_solved_problem": participant.max_solved_problem or 0,
            "weekly_contest_point": float(participant.weekly_contest_point or 0.0),
            "codeforces_solved_last_7_days": participant.codeforces_solved_last_7_days or 0,
            "atcoder_solved_last_7_days": participant.atcoder_solved_last_7_days or 0,
            "total_solved_last_7_days": participant.total_solved_last_7_days or 0,
            "codeforces_rating": participant.codeforces_rating or 0,
            "atcoder_rating": participant.atcoder_rating or 0,
            "weekly_positions_history": json.dumps(position_history),
            "created_at": participant.created_at.isoformat() if participant.created_at else None,
        }
    }
