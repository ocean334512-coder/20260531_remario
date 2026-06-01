TIME_BONUS_CAP_SEC = 600


def compute_total_score(game_score: int, distance_m: int, elapsed_ms: int) -> tuple[int, int]:
    elapsed_sec = max(0, elapsed_ms // 1000)
    time_bonus = max(0, TIME_BONUS_CAP_SEC - elapsed_sec)
    total_score = game_score + distance_m + time_bonus
    return total_score, time_bonus
