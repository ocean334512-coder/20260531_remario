import sqlite3
from contextlib import contextmanager
from typing import Any, Iterator

from app.config import BACKUP_PATH, DATABASE_PATH, DATABASE_URL, DATA_DIR
from app.scoring import TIME_BONUS_CAP_SEC


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


def _sqlite_columns(conn: sqlite3.Connection) -> set[str]:
    return {row[1] for row in conn.execute("PRAGMA table_info(scores)").fetchall()}


def _migrate_sqlite(conn: sqlite3.Connection) -> None:
    cols = _sqlite_columns(conn)
    if not cols:
        return

    if "username_key" not in cols:
        _migrate_sqlite_legacy(conn)
        cols = _sqlite_columns(conn)

    if "total_score" not in cols:
        conn.execute("ALTER TABLE scores ADD COLUMN game_score INTEGER NOT NULL DEFAULT 0")
        conn.execute("ALTER TABLE scores ADD COLUMN elapsed_ms INTEGER NOT NULL DEFAULT 0")
        conn.execute("ALTER TABLE scores ADD COLUMN time_bonus INTEGER NOT NULL DEFAULT 0")
        conn.execute("ALTER TABLE scores ADD COLUMN total_score INTEGER NOT NULL DEFAULT 0")
        conn.execute(
            f"""
            UPDATE scores SET
                time_bonus = MAX(0, {TIME_BONUS_CAP_SEC}),
                total_score = distance_m + game_score + MAX(0, {TIME_BONUS_CAP_SEC})
            """
        )


def _migrate_sqlite_legacy(conn: sqlite3.Connection) -> None:
    cols = _sqlite_columns(conn)
    if "username_key" in cols or "username" not in cols:
        return

    conn.execute(
        """
        CREATE TABLE scores_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username_key TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL,
            game_score INTEGER NOT NULL DEFAULT 0,
            distance_m INTEGER NOT NULL,
            elapsed_ms INTEGER NOT NULL DEFAULT 0,
            time_bonus INTEGER NOT NULL DEFAULT 0,
            total_score INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    conn.execute(
        f"""
        INSERT INTO scores_new (
            username_key, username, game_score, distance_m, elapsed_ms, time_bonus, total_score, updated_at
        )
        SELECT
            LOWER(TRIM(username)),
            (
                SELECT s2.username
                FROM scores s2
                WHERE LOWER(TRIM(s2.username)) = LOWER(TRIM(scores.username))
                ORDER BY s2.distance_m DESC, s2.id DESC
                LIMIT 1
            ),
            0,
            MAX(distance_m),
            0,
            MAX(0, {TIME_BONUS_CAP_SEC}),
            MAX(distance_m) + MAX(0, {TIME_BONUS_CAP_SEC}),
            datetime('now')
        FROM scores
        GROUP BY LOWER(TRIM(username))
        """
    )
    conn.execute("DROP TABLE scores")
    conn.execute("ALTER TABLE scores_new RENAME TO scores")


def _migrate_postgres(conn: Any) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'scores'
        """
    )
    cols = {row["column_name"] for row in cur.fetchall()}
    if "total_score" in cols:
        return

    cur.execute("ALTER TABLE scores ADD COLUMN game_score INTEGER NOT NULL DEFAULT 0")
    cur.execute("ALTER TABLE scores ADD COLUMN elapsed_ms INTEGER NOT NULL DEFAULT 0")
    cur.execute("ALTER TABLE scores ADD COLUMN time_bonus INTEGER NOT NULL DEFAULT 0")
    cur.execute("ALTER TABLE scores ADD COLUMN total_score INTEGER NOT NULL DEFAULT 0")
    cur.execute(
        f"""
        UPDATE scores SET
            time_bonus = GREATEST(0, {TIME_BONUS_CAP_SEC}),
            total_score = distance_m + game_score + GREATEST(0, {TIME_BONUS_CAP_SEC})
        """
    )


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
                    game_score INTEGER NOT NULL DEFAULT 0 CHECK (game_score >= 0),
                    distance_m INTEGER NOT NULL CHECK (distance_m >= 0),
                    elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
                    time_bonus INTEGER NOT NULL DEFAULT 0 CHECK (time_bonus >= 0),
                    total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS idx_scores_total ON scores (total_score DESC)"
            )
            _migrate_postgres(conn)
    else:
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username_key TEXT NOT NULL UNIQUE,
                    username TEXT NOT NULL,
                    game_score INTEGER NOT NULL DEFAULT 0,
                    distance_m INTEGER NOT NULL,
                    elapsed_ms INTEGER NOT NULL DEFAULT 0,
                    time_bonus INTEGER NOT NULL DEFAULT 0,
                    total_score INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_scores_total ON scores (total_score DESC)"
            )
            _migrate_sqlite(conn)

    from app.score_store import restore_backup_if_empty

    restored = restore_backup_if_empty()
    if restored:
        print(f"[leaderboard] restored {restored} scores from {BACKUP_PATH}")
