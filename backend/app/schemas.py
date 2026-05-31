from pydantic import BaseModel, Field, field_validator


class ScoreCreate(BaseModel):
    username: str = Field(min_length=1, max_length=20)
    distance_m: int = Field(ge=0, le=10000)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("username required")
        return name


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    distance_m: int


class LeaderboardResponse(BaseModel):
    items: list[LeaderboardEntry]
