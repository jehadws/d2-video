import json
import tempfile
import unittest
from pathlib import Path

from tools.production import build_plan, append_event, summarize_events


class ProductionPlanningTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.project = Path(self.temp.name)
        (self.project / "story").mkdir()
        self.shots = [
            {"id": f"s{i:03d}", "start": (i - 1) * 2, "end": i * 2}
            for i in range(1, 24)
        ]
        (self.project / "story" / "shots.json").write_text(
            json.dumps({"shots": self.shots}), encoding="utf-8"
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_plan_groups_shots_into_bounded_batches(self):
        plan = build_plan(self.project, batch_size=10, max_concurrency=2)
        self.assertEqual(plan["shot_count"], 23)
        self.assertEqual([b["shot_count"] for b in plan["batches"]], [10, 10, 3])
        self.assertEqual(plan["max_concurrency"], 2)
        self.assertEqual(plan["batches"][0]["shot_ids"][0], "s001")
        self.assertEqual(plan["batches"][-1]["shot_ids"][-1], "s023")

    def test_plan_rejects_duplicate_ids(self):
        self.shots[1]["id"] = self.shots[0]["id"]
        with self.assertRaisesRegex(ValueError, "Duplicate shot id"):
            build_plan(self.project, 10, 2)

    def test_plan_rejects_invalid_timing(self):
        self.shots[0]["end"] = self.shots[0]["start"]
        with self.assertRaisesRegex(ValueError, "end > start"):
            build_plan(self.project, 10, 2)

    def test_telemetry_pairs_stage_events_and_reports_unmatched_starts(self):
        append_event(self.project, "shot-generation", "started", "batch-001", None)
        append_event(self.project, "shot-generation", "completed", "batch-001", "ok")
        append_event(self.project, "visual-qa", "started", None, None)
        report = summarize_events(self.project)
        self.assertEqual(report["event_count"], 3)
        self.assertEqual(len(report["completed"]), 1)
        self.assertTrue(report["completed"][0]["matched_start"])
        self.assertEqual(report["completed"][0]["stage"], "shot-generation")
        self.assertEqual(len(report["unmatched_starts"]), 1)


if __name__ == "__main__":
    unittest.main()
