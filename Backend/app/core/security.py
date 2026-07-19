import jwt
import os
from dotenv import load_dotenv
from datetime import datetime,timedelta

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


class AuthHelper(object):
    
    @staticmethod
    def encode(username : str, email : str)->str:
        
        payload = {
            "username" : username,
            "email": email,
            "exp" : datetime.utcnow() + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(payload,SECRET_KEY,ALGORITHM)
        
    @staticmethod
    def decode(token : str)-> dict:
        
        try:
            payload = jwt.decode(token,SECRET_KEY,ALGORITHM)
            
            return payload
        except jwt.ExpiredSignatureError:
            raise Exception("Token has expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
        
        
        
        