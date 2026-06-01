import json
import os
from pathlib import Path
from typing import Any

from app.config import BACKUP_PATH, DATA_DIR

BACKUP_BAK_PATH = BACKUP_PATH.with_suffix(".json.bak")


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def save_backup(entries: list[dict[str, Any]]) -> None:
    ensure_data_dir()
    payload = {
        "version": 2,
        "scores": sorted(
            entries,
            key=lambda row: (
                -int(row.get("total_score", 0)),
                int(row.get("elapsed_ms", 0)),
                str(row.get("username", "")).lower(),
            ),
        ),
    }
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    tmp_path = BACKUP_PATH.with_suffix(".json.tmp")

    tmp_path.write_text(text, encoding="utf-8")
    os.replace(tmp_path, BACKUP_PATH)
    try:
        BACKUP_BAK_PATH.write_text(text, encoding="utf-8")
    except OSError:
        pass


def _parse_backup_text(text: str) -> list[dict[str, Any]]:
    data = json.loads(text)
    raw = data.get("scores", data) if isinstance(data, dict) else data
    if not isinstance(raw, list):
        return []

    entries: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        username = str(item.get("username", "")).strip()
        if not username:
            continue
        if "total_score" in item:
            entries.append(
                {
                    "username": username,
                    "game_score": int(item.get("game_score", 0)),
                    "distance_m": int(item.get("distance_m", 0)),
                    "elapsed_ms": int(item.get("elapsed_ms", 0)),
                }
            )
        elif "distance_m" in item:
            entries.append(
                {
                    "username": username,
                    "game_score": 0,
                    "distance_m": int(item["distance_m"]),
                    "elapsed_ms": int(item.get("elapsed_ms", 600_000)),
                }
            )
    return entries


def _load_backup_file(path: Path) -> list[dict[str, Any]]:
    try:
        return _parse_backup_text(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return []


def load_backup() -> list[dict[str, Any]]:
    primary = _load_backup_file(BACKUP_PATH)
    if primary:
        return primary
    return _load_backup_file(BACKUP_BAK_PATH)


def export_all_scores(conn: Any, use_pg: bool) -> None:
    if use_pg:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT username, game_score, distance_m, elapsed_ms, time_bonus, total_score
            FROM scores ORDER BY total_score DESC, elapsed_ms ASC, username ASC
            """
        )
        rows = cur.fetchall()
    else:
        rows = conn.execute(
            """
            SELECT username, game_score, distance_m, elapsed_ms, time_bonus, total_score
            FROM scores ORDER BY total_score DESC, elapsed_ms ASC, username ASC
            """
        ).fetchall()

    save_backup([dict(row) for row in rows])
