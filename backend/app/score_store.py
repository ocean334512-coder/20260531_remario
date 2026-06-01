from typing import Any

from app.backup import export_all_scores, load_backup
from app.database import get_connection, use_postgres, username_key

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


def count_scores(conn: Any) -> int:
    if use_postgres():
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS cnt FROM scores")
        row = cur.fetchone()
        return int(row["cnt"])
    row = conn.execute("SELECT COUNT(*) AS cnt FROM scores").fetchone()
    return int(row["cnt"])


def upsert_score(conn: Any, username: str, distance_m: int) -> dict[str, Any]:
    key = username_key(username)
    if use_postgres():
        cur = conn.cursor()
        cur.execute(UPSERT_POSTGRES, (key, username, distance_m))
        cur.execute(
            "SELECT id, username, distance_m FROM scores WHERE username_key = %s",
            (key,),
        )
        row = cur.fetchone()
    else:
        conn.execute(UPSERT_SQLITE, (key, username, distance_m))
        row = conn.execute(
            "SELECT id, username, distance_m FROM scores WHERE username_key = ?",
            (key,),
        ).fetchone()
    return dict(row)


def restore_backup_if_empty() -> int:
    with get_connection() as conn:
        if count_scores(conn) > 0:
            return 0

        restored = 0
        for entry in load_backup():
            upsert_score(conn, entry["username"], entry["distance_m"])
            restored += 1

        if restored > 0:
            export_all_scores(conn, use_postgres())
        return restored


def upsert_and_backup(username: str, distance_m: int) -> dict[str, Any]:
    with get_connection() as conn:
        row = upsert_score(conn, username, distance_m)
        export_all_scores(conn, use_postgres())
        return row
