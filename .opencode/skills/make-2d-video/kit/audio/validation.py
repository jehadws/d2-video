"""Strict duration validation for narrated-video audio and story timelines."""


def validate_voiceover_duration(actual_seconds, expected_seconds, tolerance_seconds=1.5):
    """Reject a voiceover that would otherwise be silently padded or truncated."""
    import math

    values = (actual_seconds, expected_seconds, tolerance_seconds)
    if not all(math.isfinite(value) for value in values):
        raise ValueError("Voiceover, story, and tolerance durations must be finite numbers.")
    if actual_seconds <= 0 or expected_seconds <= 0:
        raise ValueError("Voiceover and story durations must both be greater than zero.")
    if tolerance_seconds < 0:
        raise ValueError("Duration tolerance cannot be negative.")

    delta = actual_seconds - expected_seconds
    if abs(delta) > tolerance_seconds:
        direction = "longer" if delta > 0 else "shorter"
        raise ValueError(
            f"Voiceover is {abs(delta):.2f}s {direction} than the story "
            f"({actual_seconds:.2f}s audio vs {expected_seconds:.2f}s story; "
            f"allowed difference ±{tolerance_seconds:.2f}s). "
            "Fix the shot timeline or audio before mixing. If the difference is intentional, "
            "rerun with an explicit --duration-tolerance value."
        )
    return delta
