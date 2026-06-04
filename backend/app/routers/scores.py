from fastapi import APIRouter, Query

from app.database import get_connection, use_postgres
from app.score_store import upsert_and_backup
from app.schemas import BulkScoreSync, LeaderboardEntry, LeaderboardResponse, ScoreCreate
from app.score_store import LEADERBOARD_POSTGRES, LEADERBOARD_SQLITE

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("", status_code=201)
def submit_score(body: ScoreCreate):
    row = upsert_and_backup(
        body.username,
        body.game_score,
        body.distance_m,
        body.elapsed_ms,
    )
    return {
        "id": row["id"],
        "username": row["username"],
        "game_score": row["game_score"],
        "distance_m": row["distance_m"],
        "elapsed_ms": row["elapsed_ms"],
        "time_bonus": row["time_bonus"],
        "total_score": row["total_score"],
    }


@router.post("/sync")
def sync_scores(body: BulkScoreSync):
    synced = 0
    for item in body.items:
        upsert_and_backup(
            item.username,
            item.game_score,
            item.distance_m,
            item.elapsed_ms,
        )
        synced += 1
    return {"synced": synced}


@router.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(default=20, ge=1, le=50)):
    with get_connection() as conn:
        if use_postgres():
            cur = conn.cursor()
            cur.execute(LEADERBOARD_POSTGRES, (limit,))
            rows = cur.fetchall()
        else:
            rows = conn.execute(LEADERBOARD_SQLITE, (limit,)).fetchall()

    items = [
        LeaderboardEntry(
            rank=i + 1,
            username=row["username"],
            total_score=row["total_score"],
            game_score=row["game_score"],
            distance_m=row["distance_m"],
            elapsed_sec=max(0, int(row["elapsed_ms"]) // 1000),
            time_bonus=row["time_bonus"],
        )
        for i, row in enumerate(rows)
    ]
    return LeaderboardResponse(items=items)
