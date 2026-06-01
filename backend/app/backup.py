import json
from typing import Any

from app.config import BACKUP_PATH, DATA_DIR


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def save_backup(entries: list[dict[str, Any]]) -> None:
    ensure_data_dir()
    payload = {
        "version": 1,
        "scores": sorted(
            entries,
            key=lambda row: (-int(row["distance_m"]), str(row["username"]).lower()),
        ),
    }
    BACKUP_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_backup() -> list[dict[str, Any]]:
    if not BACKUP_PATH.exists():
        return []
    try:
        data = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
        raw = data.get("scores", data) if isinstance(data, dict) else data
        if not isinstance(raw, list):
            return []
        entries: list[dict[str, Any]] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            username = str(item.get("username", "")).strip()
            distance_m = item.get("distance_m")
            if not username or not isinstance(distance_m, int):
                continue
            entries.append({"username": username, "distance_m": distance_m})
        return entries
    except (json.JSONDecodeError, OSError):
        return []


def export_all_scores(conn: Any, use_pg: bool) -> None:
    if use_pg:
        cur = conn.cursor()
        cur.execute(
            "SELECT username, distance_m FROM scores ORDER BY distance_m DESC, username ASC"
        )
        rows = cur.fetchall()
    else:
        rows = conn.execute(
            "SELECT username, distance_m FROM scores ORDER BY distance_m DESC, username ASC"
        ).fetchall()

    save_backup(
        [{"username": row["username"], "distance_m": row["distance_m"]} for row in rows]
    )
