import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB = BACKEND_ROOT / "data" / "mario.db"

DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DB)))
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://127.0.0.1:5173,http://localhost:5173",
).split(",")
