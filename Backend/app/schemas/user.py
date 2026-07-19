from pydantic import BaseModel, Field


class ParticipantSolvedCountResponse(BaseModel):
	participant_id: int
	username: str | None = None
	name: str
	codeforces_handle: str | None = None
	atcoder_handle: str | None = None
	codeforces_solved_last_7_days: int = Field(ge=0)
	atcoder_solved_last_7_days: int = Field(ge=0)
	total_solved_last_7_days: int = Field(ge=0)


class ParticipantSolvedCountsResponse(BaseModel):
	participants: list[ParticipantSolvedCountResponse]


class ParticipantWeeklyPointsResponse(ParticipantSolvedCountResponse):
	contest_solved_count: int = Field(ge=0)
	weekly_contest_solved_problem: int = Field(ge=0)
	max_solved_problem: int = Field(ge=0)
	codeforces_rating: float = Field(ge=0)
	atcoder_rating: float = Field(ge=0)
	weekly_contest_point: float = Field(ge=0)
	weekly_points: int = Field(ge=0)


class ParticipantWeeklyPointsListResponse(BaseModel):
	participants: list[ParticipantWeeklyPointsResponse]
