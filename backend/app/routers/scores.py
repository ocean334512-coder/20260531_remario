from fastapi import APIRouter, Query

from app.database import get_connection
from app.schemas import LeaderboardEntry, LeaderboardResponse, ScoreCreate

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("", status_code=201)
def submit_score(body: ScoreCreate):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO scores (username, distance_m) VALUES (?, ?)",
            (body.username, body.distance_m),
        )
        conn.commit()
        score_id = cur.lastrowid
    return {"id": score_id, "username": body.username, "distance_m": body.distance_m}


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(default=10, ge=1, le=50)):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT username, MAX(distance_m) AS distance_m
            FROM scores
            GROUP BY LOWER(TRIM(username))
            ORDER BY distance_m DESC, username ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    items = [
        LeaderboardEntry(rank=i + 1, username=row["username"], distance_m=row["distance_m"])
        for i, row in enumerate(rows)
    ]
    return LeaderboardResponse(items=items)
