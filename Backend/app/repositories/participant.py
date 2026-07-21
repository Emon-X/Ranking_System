

from app.repositories.base import BaseRepository
from app.models.participant import Participant
from sqlalchemy.orm import Session
from app.core.security import AuthHelper
from app.core.hash import Hash_helper



class ParticipantRepository(BaseRepository):
    
    def get_participant_by_id(self, participant_id: int):
        return self.db.query(Participant).filter(Participant.id == participant_id).first()

    def get_participant_by_username(self, username: str):
        return self.db.query(Participant).filter(Participant.username == username).first()

    def create_participant(self, participant_data: dict):
        # Prevent overriding auto-increment ID
        participant_data.pop("id", None)
        
        # Convert empty strings to None for handles that have unique constraints
        for handle in ["codeforces_handle", "atcoder_handle", "codechef_handle", "vjudge_handle"]:
            if participant_data.get(handle) == "":
                participant_data[handle] = None

        if not participant_data.get("vjudge_handle"):
            participant_data["vjudge_handle"] = participant_data.get("username")
            
        new_participant = Participant(**participant_data)
        
        existing_user = self.db.query(Participant).filter(
            (Participant.username == new_participant.username) | 
            (Participant.email == new_participant.email) |
            (Participant.vjudge_handle == new_participant.vjudge_handle)
        ).first()
        
        if existing_user:
            if existing_user.username == new_participant.username:
                raise ValueError("User with this username already exists.")
            if existing_user.email == new_participant.email:
                raise ValueError("User with this email already exists.")
            if existing_user.vjudge_handle == new_participant.vjudge_handle:
                raise ValueError(f"User with this VJudge username ({new_participant.vjudge_handle}) already exists.")

        new_participant.password = Hash_helper.get_password_hash(new_participant.password)
        
        self.db.add(new_participant)
        try:
            self.db.commit()
            self.db.refresh(new_participant)
        except Exception as e:
            self.db.rollback()
            err_msg = str(e)
            if "duplicate key value violates unique constraint" in err_msg:
                if "pkey" in err_msg:
                    raise ValueError("Failed to create user: Duplicate ID.")
                raise ValueError("One or more handles (Codeforces, AtCoder, CodeChef, VJudge) are already taken by another user.")
            raise ValueError("Failed to create user due to database error.")
    
        return new_participant
       
    
    def get_all_participants(self):
        return self.db.query(Participant).order_by(
            Participant.weekly_points.desc(),
            Participant.codeforces_rating.desc(),
            Participant.atcoder_rating.desc(),
            Participant.total_solved_last_7_days.desc()
        ).all()
    
    def Login(self,username :str,password : str):
        
        user = self.db.query(Participant).filter(Participant.username == username).first()
        if not user:
            return None
        
        if not Hash_helper.verify_password(password, user.password):
            return None
        
        return user
    
    def get_user_by_rank(self):
        users = self.db.query(Participant).order_by(
            Participant.weekly_points.desc(),
            Participant.codeforces_rating.desc(),
            Participant.atcoder_rating.desc(),
            Participant.total_solved_last_7_days.desc()
        ).all()
        return users
    
    def get_user_by_solve(self):
        
        users = self.db.query(Participant).order_by(Participant.total_solved_last_7_days.desc()).all()
        
        return users