from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database.db import Base
from datetime import datetime

class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)          # scraped or manually set
    vjudge_url = Column(String, unique=True, index=True, nullable=False)
    scheduled_at = Column(DateTime, nullable=True) # None = no scheduled time known
    is_rated = Column(Boolean, default=True)
    duration_seconds = Column(Integer, default=7200) # Default duration: 2 hours (7200 seconds)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

