from fastapi import APIRouter, Query

from app.database import get_connection, use_postgres
from app.score_store import upsert_and_backup
from app.schemas import BulkScoreSync, LeaderboardEntry, LeaderboardResponse, ScoreCreate

router = APIRouter(prefix="/scores", tags=["scores"])

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
    row = upsert_and_backup(body.username, body.distance_m)
    return {
        "id": row["id"],
        "username": row["username"],
        "distance_m": row["distance_m"],
    }


@router.post("/sync")
def sync_scores(body: BulkScoreSync):
    synced = 0
    for item in body.items:
        upsert_and_backup(item.username, item.distance_m)
        synced += 1
    return {"synced": synced}


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
