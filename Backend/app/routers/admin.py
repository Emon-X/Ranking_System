from fastapi import APIRouter, Depends, HTTPException
from app.schemas.participant import Participant
from app.repositories.participant import ParticipantRepository
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.core.dependencis import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ViewAllUsers",)
async def view_all_users(db : Session = Depends(get_db), current_user = Depends(get_current_user)):
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to view all users.")
    
    participants = ParticipantRepository(db).get_all_participants()
    return {"participants": participants}


@router.delete("/DeleteUser/{participant_username}")
async def delete_user(participant_username: str, db : Session = Depends(get_db), current_user = Depends(get_current_user)):
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to delete users.")
    
    participant = ParticipantRepository(db).get_participant_by_username(participant_username)
    if not participant:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(participant)
    db.commit()
    return {"message": "User deleted successfully"}