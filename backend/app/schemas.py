from pydantic import BaseModel, Field, field_validator


class ScoreCreate(BaseModel):
    username: str = Field(min_length=1, max_length=20)
    game_score: int = Field(ge=0, le=999_999)
    distance_m: int = Field(ge=0, le=10_000)
    elapsed_ms: int = Field(ge=0, le=3_600_000)

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
    total_score: int
    game_score: int
    distance_m: int
    elapsed_sec: int
    time_bonus: int


class LeaderboardResponse(BaseModel):
    items: list[LeaderboardEntry]


class ScoreSyncItem(BaseModel):
    username: str = Field(min_length=1, max_length=20)
    game_score: int = Field(ge=0, le=999_999)
    distance_m: int = Field(ge=0, le=10_000)
    elapsed_ms: int = Field(ge=0, le=3_600_000)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("username required")
        return name


class BulkScoreSync(BaseModel):
    items: list[ScoreSyncItem] = Field(min_length=1, max_length=500)
