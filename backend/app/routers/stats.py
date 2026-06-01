from fastapi import APIRouter

from app.play_count_store import (
    DEFAULT_STAGE_ID,
    add_pending_play_count,
    get_play_count,
    increment_play_count,
)
from app.schemas import PlayCountAdd, PlayCountResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/{stage_id}/play-count", response_model=PlayCountResponse)
def read_play_count(stage_id: str = DEFAULT_STAGE_ID):
    return PlayCountResponse(stage_id=stage_id, play_count=get_play_count(stage_id))


@router.post("/{stage_id}/play", response_model=PlayCountResponse)
def record_play(stage_id: str = DEFAULT_STAGE_ID):
    return PlayCountResponse(
        stage_id=stage_id,
        play_count=increment_play_count(stage_id, 1),
    )


@router.post("/{stage_id}/play/add", response_model=PlayCountResponse)
def record_play_bulk(stage_id: str, body: PlayCountAdd):
    delta = max(0, body.add)
    if delta == 0:
        return PlayCountResponse(stage_id=stage_id, play_count=get_play_count(stage_id))
    return PlayCountResponse(
        stage_id=stage_id,
        play_count=add_pending_play_count(stage_id, delta),
    )
