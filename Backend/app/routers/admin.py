from fastapi import APIRouter, Depends, HTTPException
from app.schemas.participant import Participant, ParticipantUpdate
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

@router.put("/UpdateUser/{participant_username}")
async def update_user(participant_username: str, info: ParticipantUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to update users.")
    
    participant = ParticipantRepository(db).get_participant_by_username(participant_username)
    if not participant:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = info.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key in ["codeforces_handle", "atcoder_handle", "codechef_handle", "vjudge_handle"] and value == "":
            value = None
        setattr(participant, key, value)
        
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        err_msg = str(e)
        if "duplicate key value violates unique constraint" in err_msg:
            raise HTTPException(status_code=400, detail="One or more handles (Codeforces, AtCoder, CodeChef, VJudge) are already taken by another user.")
        raise HTTPException(status_code=500, detail="Failed to update user due to database error.")
        
    return {"message": "User updated successfully"}