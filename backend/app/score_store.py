from typing import Any

from app.backup import export_all_scores, load_backup
from app.database import get_connection, use_postgres, username_key
from app.scoring import compute_total_score

UPSERT_SQLITE = """
INSERT INTO scores (
    username_key, username, game_score, distance_m, elapsed_ms, time_bonus, total_score, updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(username_key) DO UPDATE SET
    username = excluded.username,
    game_score = MAX(scores.game_score, excluded.game_score),
    distance_m = MAX(scores.distance_m, excluded.distance_m),
    elapsed_ms = CASE
        WHEN excluded.total_score > scores.total_score THEN excluded.elapsed_ms
        WHEN excluded.total_score = scores.total_score AND excluded.elapsed_ms < scores.elapsed_ms
            THEN excluded.elapsed_ms
        ELSE scores.elapsed_ms
    END,
    time_bonus = CASE
        WHEN excluded.total_score >= scores.total_score THEN excluded.time_bonus
        ELSE scores.time_bonus
    END,
    total_score = MAX(scores.total_score, excluded.total_score),
    updated_at = datetime('now')
"""

UPSERT_POSTGRES = """
INSERT INTO scores (
    username_key, username, game_score, distance_m, elapsed_ms, time_bonus, total_score, updated_at
)
VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
ON CONFLICT(username_key) DO UPDATE SET
    username = EXCLUDED.username,
    game_score = GREATEST(scores.game_score, EXCLUDED.game_score),
    distance_m = GREATEST(scores.distance_m, EXCLUDED.distance_m),
    elapsed_ms = CASE
        WHEN EXCLUDED.total_score > scores.total_score THEN EXCLUDED.elapsed_ms
        WHEN EXCLUDED.total_score = scores.total_score AND EXCLUDED.elapsed_ms < scores.elapsed_ms
            THEN EXCLUDED.elapsed_ms
        ELSE scores.elapsed_ms
    END,
    time_bonus = CASE
        WHEN EXCLUDED.total_score >= scores.total_score THEN EXCLUDED.time_bonus
        ELSE scores.time_bonus
    END,
    total_score = GREATEST(scores.total_score, EXCLUDED.total_score),
    updated_at = NOW()
"""

LEADERBOARD_SQLITE = """
SELECT username, game_score, distance_m, elapsed_ms, time_bonus, total_score
FROM scores
ORDER BY total_score DESC, elapsed_ms ASC, username ASC
LIMIT ?
"""

LEADERBOARD_POSTGRES = """
SELECT username, game_score, distance_m, elapsed_ms, time_bonus, total_score
FROM scores
ORDER BY total_score DESC, elapsed_ms ASC, username ASC
LIMIT %s
"""


def count_scores(conn: Any) -> int:
    if use_postgres():
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS cnt FROM scores")
        row = cur.fetchone()
        return int(row["cnt"])
    row = conn.execute("SELECT COUNT(*) AS cnt FROM scores").fetchone()
    return int(row["cnt"])


def upsert_score(
    conn: Any,
    username: str,
    game_score: int,
    distance_m: int,
    elapsed_ms: int,
) -> dict[str, Any]:
    total_score, time_bonus = compute_total_score(game_score, distance_m, elapsed_ms)
    key = username_key(username)
    params = (key, username, game_score, distance_m, elapsed_ms, time_bonus, total_score)

    if use_postgres():
        cur = conn.cursor()
        cur.execute(UPSERT_POSTGRES, params)
        cur.execute(
            """
            SELECT id, username, game_score, distance_m, elapsed_ms, time_bonus, total_score
            FROM scores WHERE username_key = %s
            """,
            (key,),
        )
        row = cur.fetchone()
    else:
        conn.execute(UPSERT_SQLITE, params)
        row = conn.execute(
            """
            SELECT id, username, game_score, distance_m, elapsed_ms, time_bonus, total_score
            FROM scores WHERE username_key = ?
            """,
            (key,),
        ).fetchone()
    return dict(row)


def merge_backup_on_startup() -> int:
    """배포·DB 초기화 후에도 JSON 백업에서 순위 복구·병합 (항상 최고 기록 유지)."""
    entries = load_backup()
    if not entries:
        return 0

    merged = 0
    with get_connection() as conn:
        for entry in entries:
            upsert_score(
                conn,
                entry["username"],
                int(entry.get("game_score", 0)),
                int(entry.get("distance_m", 0)),
                int(entry.get("elapsed_ms", 0)),
            )
            merged += 1
        export_all_scores(conn, use_postgres())
    return merged


def upsert_and_backup(
    username: str,
    game_score: int,
    distance_m: int,
    elapsed_ms: int,
) -> dict[str, Any]:
    with get_connection() as conn:
        row = upsert_score(conn, username, game_score, distance_m, elapsed_ms)
        export_all_scores(conn, use_postgres())
        return row
