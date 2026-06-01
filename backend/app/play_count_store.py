import json
import os
from pathlib import Path
from typing import Any

from app.config import DATA_DIR

PLAY_COUNT_BACKUP_PATH = DATA_DIR / "stage-play-count.json"
PLAY_COUNT_BACKUP_BAK = PLAY_COUNT_BACKUP_PATH.with_suffix(".json.bak")
DEFAULT_STAGE_ID = "stage1"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_backup_counts() -> dict[str, int]:
    best: dict[str, int] = {}
    for path in (PLAY_COUNT_BACKUP_PATH, PLAY_COUNT_BACKUP_BAK):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError, TypeError, ValueError):
            continue
        stages = data.get("stages", data) if isinstance(data, dict) else {}
        if not isinstance(stages, dict):
            continue
        for stage_id, value in stages.items():
            try:
                count = int(value)
            except (TypeError, ValueError):
                continue
            if count >= 0:
                best[str(stage_id)] = max(best.get(str(stage_id), 0), count)
    return best


def _save_backup_counts(counts: dict[str, int]) -> None:
    _ensure_data_dir()
    payload = {"version": 1, "stages": dict(sorted(counts.items()))}
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    tmp = PLAY_COUNT_BACKUP_PATH.with_suffix(".json.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, PLAY_COUNT_BACKUP_PATH)
    try:
        PLAY_COUNT_BACKUP_BAK.write_text(text, encoding="utf-8")
    except OSError:
        pass


def _read_db_count(conn: Any, stage_id: str) -> int:
    from app.database import use_postgres

    if use_postgres():
        cur = conn.cursor()
        cur.execute(
            "SELECT play_count FROM stage_play_counts WHERE stage_id = %s",
            (stage_id,),
        )
        row = cur.fetchone()
    else:
        row = conn.execute(
            "SELECT play_count FROM stage_play_counts WHERE stage_id = ?",
            (stage_id,),
        ).fetchone()
    return int(row["play_count"]) if row else 0


def _write_db_count(conn: Any, stage_id: str, play_count: int) -> None:
    from app.database import use_postgres

    if use_postgres():
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO stage_play_counts (stage_id, play_count, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT(stage_id) DO UPDATE SET
                play_count = GREATEST(stage_play_counts.play_count, EXCLUDED.play_count),
                updated_at = NOW()
            """,
            (stage_id, play_count),
        )
    else:
        conn.execute(
            """
            INSERT INTO stage_play_counts (stage_id, play_count, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(stage_id) DO UPDATE SET
                play_count = MAX(stage_play_counts.play_count, excluded.play_count),
                updated_at = datetime('now')
            """,
            (stage_id, play_count),
        )


def init_play_count_tables(conn: Any) -> None:
    from app.database import use_postgres

    if use_postgres():
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS stage_play_counts (
                stage_id VARCHAR(32) PRIMARY KEY,
                play_count INTEGER NOT NULL DEFAULT 0 CHECK (play_count >= 0),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    else:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS stage_play_counts (
                stage_id TEXT PRIMARY KEY,
                play_count INTEGER NOT NULL DEFAULT 0,
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )


def merge_play_count_backup_on_startup() -> int:
    backup = _load_backup_counts()
    from app.database import get_connection

    merged = 0
    with get_connection() as conn:
        for stage_id, backup_count in backup.items():
            db_count = _read_db_count(conn, stage_id)
            if backup_count > db_count:
                _write_db_count(conn, stage_id, backup_count)
                merged += 1
        stage_ids = set(backup.keys()) | {DEFAULT_STAGE_ID}
        counts = {sid: _read_db_count(conn, sid) for sid in stage_ids}
        _save_backup_counts(counts)
    return merged


def get_play_count(stage_id: str = DEFAULT_STAGE_ID) -> int:
    from app.database import get_connection

    with get_connection() as conn:
        return _read_db_count(conn, stage_id)


def increment_play_count(stage_id: str = DEFAULT_STAGE_ID, delta: int = 1) -> int:
    if delta < 1:
        return get_play_count(stage_id)

    from app.database import get_connection, use_postgres

    with get_connection() as conn:
        if use_postgres():
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO stage_play_counts (stage_id, play_count, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT(stage_id) DO UPDATE SET
                    play_count = stage_play_counts.play_count + EXCLUDED.play_count,
                    updated_at = NOW()
                RETURNING play_count
                """,
                (stage_id, delta),
            )
            row = cur.fetchone()
            new_count = int(row["play_count"])
        else:
            conn.execute(
                """
                INSERT INTO stage_play_counts (stage_id, play_count, updated_at)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(stage_id) DO UPDATE SET
                    play_count = play_count + excluded.play_count,
                    updated_at = datetime('now')
                """,
                (stage_id, delta),
            )
            new_count = _read_db_count(conn, stage_id)

        backup = _load_backup_counts()
        backup[stage_id] = max(backup.get(stage_id, 0), new_count)
        _save_backup_counts(backup)
        return new_count


def add_pending_play_count(stage_id: str, delta: int) -> int:
    """오프라인 동기화: 누적 증가분을 한 번에 반영."""
    return increment_play_count(stage_id, delta)
