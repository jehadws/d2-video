import unittest

from audio.validation import validate_voiceover_duration


class VoiceoverDurationValidationTests(unittest.TestCase):
    def test_accepts_matching_durations(self):
        self.assertAlmostEqual(validate_voiceover_duration(120.4, 120.0), 0.4)

    def test_accepts_difference_at_tolerance(self):
        self.assertAlmostEqual(validate_voiceover_duration(121.5, 120.0), 1.5)

    def test_rejects_audio_that_is_too_long(self):
        with self.assertRaisesRegex(ValueError, "longer than the story"):
            validate_voiceover_duration(123.0, 120.0)

    def test_rejects_audio_that_is_too_short(self):
        with self.assertRaisesRegex(ValueError, "shorter than the story"):
            validate_voiceover_duration(117.0, 120.0)

    def test_rejects_invalid_values(self):
        with self.assertRaisesRegex(ValueError, "finite"):
            validate_voiceover_duration(float("nan"), 120.0)
        with self.assertRaisesRegex(ValueError, "negative"):
            validate_voiceover_duration(120.0, 120.0, -1)


if __name__ == "__main__":
    unittest.main()
