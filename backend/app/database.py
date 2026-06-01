import sqlite3
from contextlib import contextmanager
from typing import Any, Iterator

from app.config import DATABASE_PATH, DATABASE_URL


def use_postgres() -> bool:
    return DATABASE_URL.startswith(("postgres://", "postgresql://"))


def username_key(username: str) -> str:
    return username.strip().lower()


@contextmanager
def get_connection() -> Iterator[Any]:
    if use_postgres():
        import psycopg2
        from psycopg2.extras import RealDictCursor

        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def _migrate_sqlite_legacy(conn: sqlite3.Connection) -> None:
    cols = {row[1] for row in conn.execute("PRAGMA table_info(scores)").fetchall()}
    if not cols or "username_key" in cols:
        return

    conn.execute(
        """
        CREATE TABLE scores_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username_key TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL,
            distance_m INTEGER NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        """
        INSERT INTO scores_new (username_key, username, distance_m, updated_at)
        SELECT
            LOWER(TRIM(username)),
            (
                SELECT s2.username
                FROM scores s2
                WHERE LOWER(TRIM(s2.username)) = LOWER(TRIM(scores.username))
                ORDER BY s2.distance_m DESC, s2.id DESC
                LIMIT 1
            ),
            MAX(distance_m),
            datetime('now')
        FROM scores
        GROUP BY LOWER(TRIM(username))
        """
    )
    conn.execute("DROP TABLE scores")
    conn.execute("ALTER TABLE scores_new RENAME TO scores")


def init_db() -> None:
    if use_postgres():
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS scores (
                    id SERIAL PRIMARY KEY,
                    username_key VARCHAR(64) NOT NULL UNIQUE,
                    username VARCHAR(64) NOT NULL,
                    distance_m INTEGER NOT NULL CHECK (distance_m >= 0),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_scores_distance ON scores (distance_m DESC)"
            )
        return

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username_key TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                distance_m INTEGER NOT NULL,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_scores_distance ON scores (distance_m DESC)"
        )
        _migrate_sqlite_legacy(conn)
