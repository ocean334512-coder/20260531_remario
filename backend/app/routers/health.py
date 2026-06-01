from fastapi import APIRouter

from app.backup import load_backup
from app.config import BACKUP_PATH, DATABASE_URL, DATA_DIR
from app.database import get_connection, use_postgres
from app.score_store import count_scores

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    with get_connection() as conn:
        scores_count = count_scores(conn)

    return {
        "status": "ok",
        "db": "postgres" if use_postgres() else "sqlite",
        "persistent": use_postgres() or str(DATA_DIR) != "/tmp",
        "scores_count": scores_count,
        "backup_file": str(BACKUP_PATH),
        "backup_entries": len(load_backup()),
        "database_url_set": bool(DATABASE_URL),
    }
