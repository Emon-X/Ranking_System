from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

def migrate_db(engine):
    inspector = inspect(engine)
    
    # Migrate participants
    if "participants" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("participants")]
        with engine.begin() as conn:
            cols_to_add = [
                ("contest_solved_count", "INTEGER DEFAULT 0"),
                ("weekly_contest_solved_problem", "INTEGER DEFAULT 0"),
                ("max_solved_problem", "INTEGER DEFAULT 0"),
                ("weekly_contest_point", "DOUBLE PRECISION DEFAULT 0.0" if "postgresql" in str(engine.url) else "FLOAT DEFAULT 0.0"),
                ("codeforces_solved_last_7_days", "INTEGER DEFAULT 0"),
                ("atcoder_solved_last_7_days", "INTEGER DEFAULT 0"),
                ("total_solved_last_7_days", "INTEGER DEFAULT 0"),
                ("codeforces_rating", "INTEGER DEFAULT 0"),
                ("atcoder_rating", "INTEGER DEFAULT 0"),
                ("weekly_positions_history", "VARCHAR(1000) DEFAULT '[]'"),
                ("weekly_position", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_type in cols_to_add:
                if col_name not in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE participants ADD COLUMN {col_name} {col_type}"))
                        logger.info(f"Added column {col_name} to participants table.")
                    except Exception as e:
                        logger.error(f"Error adding column {col_name}: {e}")

    # Migrate contests
    if "contests" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("contests")]
        with engine.begin() as conn:
            cols_to_add = [
                ("duration_seconds", "INTEGER DEFAULT 7200"),
                ("processed", "BOOLEAN DEFAULT FALSE")
            ]
            for col_name, col_type in cols_to_add:
                if col_name not in columns:
                    try:
                        conn.execute(text(f"ALTER TABLE contests ADD COLUMN {col_name} {col_type}"))
                        logger.info(f"Added column {col_name} to contests table.")
                    except Exception as e:
                        logger.error(f"Error adding column {col_name}: {e}")
