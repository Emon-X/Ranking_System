from bcrypt import checkpw,hashpw,gensalt


class Hash_helper(object):
    
    @staticmethod
    def verify_password(plain_password : str, hashed_password : str) -> bool:
        
        try:
            return checkpw(plain_password.encode('utf-8'),hashed_password.encode('utf-8'))
        except (ValueError,TypeError):
            return False
        
        
    @staticmethod
    def get_password_hash(plain_password : str)->str:
        
        salt = gensalt()
        hashed = hashpw(plain_password.encode('utf-8'),salt)
        
        return hashed.decode('utf-8')
        