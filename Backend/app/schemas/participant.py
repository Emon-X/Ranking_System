from pydantic import BaseModel,Field, HttpUrl


class Participant(BaseModel):
    
    id: int | None = None
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=2, max_length=100)
    email: str = Field(...,)
    password: str = Field(..., min_length=6)
    codeforces_handle: str | None = Field(default=None, description="Codeforces handle of the participant")
    atcoder_handle: str | None = Field(default=None, description="AtCoder handle of the participant")
    codechef_handle: str | None = Field(default=None, description="CodeChef handle of the participant")
    vjudge_handle: str | None = Field(default=None, description="VJudge handle of the participant")
    role : str = Field(default="participant")