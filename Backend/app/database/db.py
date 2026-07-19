from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

Base = declarative_base()
session_local = sessionmaker(autocommit=False, autoflush=True, bind=engine)

def get_db() -> Generator:
    db = session_local()
    try:
        yield db
    finally:
        db.close()