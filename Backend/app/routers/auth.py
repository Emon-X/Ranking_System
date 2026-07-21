from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.schemas.participant import Participant
from sqlalchemy.orm import Session
from app.database.db import get_db, session_local
from app.repositories.participant import ParticipantRepository
from app.core.security import AuthHelper
from app.services.rank import recalculate_all_users_standings, update_new_user_with_latest_contest
from app.models.participant import Participant as ParticipantModel
import asyncio

auth_router = APIRouter(prefix="/auth", tags=["auth"])

def run_recalc_task(participant_id: int):
    # Synchronous wrapper to run async code inside background task
    async def _async_task():
        db = session_local()
        try:
            user = db.query(ParticipantModel).filter(ParticipantModel.id == participant_id).first()
            if user:
                await update_new_user_with_latest_contest(db, user)
                await recalculate_all_users_standings(db)
        finally:
            db.close()
    
    asyncio.run(_async_task())

@auth_router.post("/SignIn")
async def login(username: str, password: str, db: Session = Depends(get_db)):
    user = ParticipantRepository(db).Login(username, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = AuthHelper.encode(user.username, user.email)
    return {
        "token": token,
        "username": user.username,
        "role": user.role
    }
    
@auth_router.post("/SignUp")
async def signup(info : Participant, background_tasks: BackgroundTasks, db : Session = Depends(get_db)):
    try:
        user = ParticipantRepository(db).create_participant(info.model_dump())
        
        # Add to background tasks to prevent timeout
        background_tasks.add_task(run_recalc_task, user.id)
        
        token = AuthHelper.encode(user.username, user.email)
        return {
            "token": token,
            "username": user.username,
            "role": user.role
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
