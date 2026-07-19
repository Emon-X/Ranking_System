

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
        if not participant_data.get("vjudge_handle"):
            participant_data["vjudge_handle"] = participant_data.get("username")
            
        new_participant = Participant(**participant_data)
        
        existing_user = self.db.query(Participant).filter((Participant.username==new_participant.username)|(Participant.email==new_participant.email)).first()
        if existing_user:
            raise ValueError("User with this username or email already exists")

        new_participant.password = Hash_helper.get_password_hash(new_participant.password)
        
        self.db.add(new_participant)
        self.db.commit()
        self.db.refresh(new_participant)
    
        return new_participant
       
    
    def get_all_participants(self):
        return self.db.query(Participant).order_by(Participant.weekly_points.desc()).all()
    
    def Login(self,username :str,password : str):
        
        user = self.db.query(Participant).filter(Participant.username == username).first()
        if not user:
            return None
        
        if not Hash_helper.verify_password(password, user.password):
            return None
        
        return user
    
    def get_user_by_rank(self):
        
        users = self.db.query(Participant).order_by(Participant.weekly_points.desc()).all()
        return users
    
    def get_user_by_solve(self):
        
        users = self.db.query(Participant).order_by(Participant.total_solved_last_7_days.desc()).all()
        
        return users