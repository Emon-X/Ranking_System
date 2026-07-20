from fastapi import APIRouter, Depends, HTTPException
from app.schemas.participant import Participant
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.repositories.participant import ParticipantRepository
from app.core.security import AuthHelper
from app.services.rank import recalculate_all_users_standings


auth_router = APIRouter(prefix="/auth", tags=["auth"])


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
async def signup(info : Participant,db : Session = Depends(get_db)):
    try:
        user = ParticipantRepository(db).create_participant(info.model_dump())
        await recalculate_all_users_standings(db)
        token = AuthHelper.encode(user.username, user.email)
        return {
            "token": token,
            "username": user.username,
            "role": user.role
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

