from app.database.db import session_local
from app.models.participant import Participant

db = session_local()
user = db.query(Participant).filter(Participant.username == "CE_24059").first()
if user:
    print(f"FOUND: {user.username}, CF: {user.codeforces_handle}")
else:
    print("NOT FOUND")
