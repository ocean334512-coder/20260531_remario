from fastapi import APIRouter, Query

from app.database import get_connection, use_postgres, username_key
from app.schemas import LeaderboardEntry, LeaderboardResponse, ScoreCreate

router = APIRouter(prefix="/scores", tags=["scores"])

UPSERT_SQLITE = """
INSERT INTO scores (username_key, username, distance_m, updated_at)
VALUES (?, ?, ?, datetime('now'))
ON CONFLICT(username_key) DO UPDATE SET
    username = excluded.username,
    distance_m = MAX(scores.distance_m, excluded.distance_m),
    updated_at = datetime('now')
"""

UPSERT_POSTGRES = """
INSERT INTO scores (username_key, username, distance_m, updated_at)
VALUES (%s, %s, %s, NOW())
ON CONFLICT(username_key) DO UPDATE SET
    username = EXCLUDED.username,
    distance_m = GREATEST(scores.distance_m, EXCLUDED.distance_m),
    updated_at = NOW()
"""

LEADERBOARD_SQLITE = """
SELECT username, distance_m
FROM scores
ORDER BY distance_m DESC, username ASC
LIMIT ?
"""

LEADERBOARD_POSTGRES = """
SELECT username, distance_m
FROM scores
ORDER BY distance_m DESC, username ASC
LIMIT %s
"""


@router.post("", status_code=201)
def submit_score(body: ScoreCreate):
    key = username_key(body.username)
    with get_connection() as conn:
        if use_postgres():
            cur = conn.cursor()
            cur.execute(UPSERT_POSTGRES, (key, body.username, body.distance_m))
            cur.execute(
                "SELECT id, distance_m FROM scores WHERE username_key = %s",
                (key,),
            )
            row = cur.fetchone()
        else:
            conn.execute(UPSERT_SQLITE, (key, body.username, body.distance_m))
            row = conn.execute(
                "SELECT id, distance_m FROM scores WHERE username_key = ?",
                (key,),
            ).fetchone()

    return {
        "id": row["id"],
        "username": body.username,
        "distance_m": row["distance_m"],
    }


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(default=10, ge=1, le=50)):
    with get_connection() as conn:
        if use_postgres():
            cur = conn.cursor()
            cur.execute(LEADERBOARD_POSTGRES, (limit,))
            rows = cur.fetchall()
        else:
            rows = conn.execute(LEADERBOARD_SQLITE, (limit,)).fetchall()

    items = [
        LeaderboardEntry(rank=i + 1, username=row["username"], distance_m=row["distance_m"])
        for i, row in enumerate(rows)
    ]
    return LeaderboardResponse(items=items)
