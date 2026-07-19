from sqlalchemy import Column, Integer, String, DateTime, Float
from app.database.db import Base
from datetime import datetime

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    codeforces_handle = Column(String, unique=True, index=True)
    atcoder_handle = Column(String, unique=True, index=True)
    codechef_handle = Column(String, unique=True, index=True)
    vjudge_handle = Column(String, unique=True, index=True)
    role = Column(String, default="participant")
    weekly_points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Caching fields for standings, solve counts, ratings and weekly positions history
    contest_solved_count = Column(Integer, default=0)
    weekly_contest_solved_problem = Column(Integer, default=0)
    max_solved_problem = Column(Integer, default=0)
    weekly_contest_point = Column(Float, default=0.0)
    codeforces_solved_last_7_days = Column(Integer, default=0)
    atcoder_solved_last_7_days = Column(Integer, default=0)
    total_solved_last_7_days = Column(Integer, default=0)
    codeforces_rating = Column(Integer, default=0)
    atcoder_rating = Column(Integer, default=0)
    weekly_positions_history = Column(String, default="[]")
    weekly_position = Column(Integer, default=0)