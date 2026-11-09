import json
import tempfile
import unittest
from pathlib import Path

from tools.production import (
    append_event, build_plan, check_shot_gate, claim_batch, production_dir,
    read_json, retry_batch, save_state, summarize_events, update_lease, write_json,
)


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

    def install_plan(self, batch_size=10, concurrency=2):
        plan = build_plan(self.project, batch_size, concurrency)
        write_json(production_dir(self.project) / "plan.json", plan)
        write_json(production_dir(self.project) / "state.json", {
            "version": 1, "max_concurrency": concurrency,
            "batches": [
                {**batch, "status": "pending", "worker": None, "token": None,
                 "lease_expires_at": None, "attempts": 0, "expired_attempts": 0}
                for batch in plan["batches"]
            ],
        })
        return plan

    def test_plan_groups_shots_into_bounded_batches(self):
        plan = build_plan(self.project, batch_size=10, max_concurrency=2)
        self.assertEqual(plan["timeline_shot_count"], 23)
        self.assertEqual(plan["selected_shot_count"], 23)
        self.assertEqual([b["shot_count"] for b in plan["batches"]], [10, 10, 3])
        self.assertEqual(plan["max_concurrency"], 2)
        self.assertEqual(plan["batches"][0]["shot_ids"][0], "s001")
        self.assertEqual(plan["batches"][-1]["shot_ids"][-1], "s023")

    def test_plan_only_schedules_missing_js_and_dsl_shots(self):
        shots_dir = self.project / "scenes" / "shots"
        visual_dir = self.project / "scenes" / "visual"
        shots_dir.mkdir(parents=True)
        visual_dir.mkdir(parents=True)
        (shots_dir / "01.js").write_text(
            "registerShot('s001', {});\nregisterShot('s002', {});", encoding="utf-8"
        )
        (visual_dir / "s003.json").write_text(
            json.dumps({"id": "s003", "shots": []}), encoding="utf-8"
        )
        plan = build_plan(self.project, batch_size=10, max_concurrency=2)
        self.assertEqual(plan["implemented_shot_count"], 3)
        self.assertEqual(plan["selected_shot_count"], 20)
        self.assertNotIn("s001", plan["missing_shot_ids"])
        self.assertNotIn("s003", plan["missing_shot_ids"])
        self.assertEqual(plan["batches"][0]["shot_ids"][0], "s004")

    def test_plan_can_explicitly_include_existing_shots(self):
        shots_dir = self.project / "scenes" / "shots"
        shots_dir.mkdir(parents=True)
        (shots_dir / "01.js").write_text("registerShot('s001', {});", encoding="utf-8")
        plan = build_plan(self.project, 10, 2, include_existing=True)
        self.assertEqual(plan["selected_shot_count"], 23)
        self.assertTrue(plan["include_existing"])

    def test_duplicate_implementations_are_reported(self):
        shots_dir = self.project / "scenes" / "shots"
        shots_dir.mkdir(parents=True)
        (shots_dir / "01.js").write_text("registerShot('s001', {});", encoding="utf-8")
        (shots_dir / "02.js").write_text("registerShot('s001', {});", encoding="utf-8")
        plan = build_plan(self.project, 10, 2)
        self.assertIn("s001", plan["duplicate_implementations"])

    def test_plan_rejects_duplicate_timeline_ids(self):
        self.shots[1]["id"] = self.shots[0]["id"]
        with self.assertRaisesRegex(ValueError, "Duplicate shot id"):
            build_plan(self.project, 10, 2)

    def test_plan_rejects_invalid_timing(self):
        self.shots[0]["end"] = self.shots[0]["start"]
        with self.assertRaisesRegex(ValueError, "end > start"):
            build_plan(self.project, 10, 2)

    def test_scheduler_enforces_concurrency_and_finishes_owned_batch(self):
        self.install_plan(batch_size=5, concurrency=1)
        first = claim_batch(self.project, "worker-1", 30)
        self.assertTrue(first["claimed"])
        blocked = claim_batch(self.project, "worker-2", 30)
        self.assertFalse(blocked["claimed"])
        self.assertEqual(blocked["reason"], "concurrency-limit")
        renewed = update_lease(
            self.project, first["batch"]["id"], "worker-1", first["token"], 30
        )
        self.assertEqual(renewed["status"], "running")
        done = update_lease(
            self.project, first["batch"]["id"], "worker-1", first["token"],
            30, finish_status="completed", note="validated",
        )
        self.assertEqual(done["status"], "completed")
        next_batch = claim_batch(self.project, "worker-2", 30)
        self.assertTrue(next_batch["claimed"])

    def test_expired_lease_is_requeued_and_old_token_rejected(self):
        self.install_plan(batch_size=5, concurrency=1)
        first = claim_batch(self.project, "worker-1", 30)
        state_path = production_dir(self.project) / "state.json"
        state = read_json(state_path)
        state["batches"][0]["lease_expires_at"] = 0
        save_state(self.project, state)
        second = claim_batch(self.project, "worker-2", 30)
        self.assertTrue(second["claimed"])
        self.assertEqual(second["batch"]["id"], first["batch"]["id"])
        with self.assertRaisesRegex(ValueError, "Lease is no longer owned"):
            update_lease(
                self.project, first["batch"]["id"], "worker-1", first["token"], 30
            )


    def test_failed_batch_requires_explicit_retry(self):
        self.install_plan(batch_size=5, concurrency=1)
        claimed = claim_batch(self.project, "worker-1", 30)
        update_lease(
            self.project, claimed["batch"]["id"], "worker-1", claimed["token"],
            30, finish_status="failed", note="validation failed",
        )
        retried = retry_batch(self.project, claimed["batch"]["id"])
        self.assertEqual(retried["status"], "pending")

    def test_shot_gate_fails_when_shots_are_missing_and_passes_when_complete(self):
        failed = check_shot_gate(self.project)
        self.assertFalse(failed["passed"])
        shots_dir = self.project / "scenes" / "shots"
        shots_dir.mkdir(parents=True)
        (shots_dir / "all.js").write_text(
            "\\n".join(f"registerShot('{shot['id']}', {{}});" for shot in self.shots),
            encoding="utf-8",
        )
        passed = check_shot_gate(self.project)
        self.assertTrue(passed["passed"])
        self.assertEqual(passed["implemented_shot_count"], 23)

    def test_telemetry_pairs_worker_events_and_reports_unmatched_starts(self):
        append_event(self.project, "shot-generation", "started", "batch-001", None, "w1")
        append_event(self.project, "shot-generation", "completed", "batch-001", "ok", "w1")
        append_event(self.project, "visual-qa", "started", None, None, "w2")
        report = summarize_events(self.project)
        self.assertEqual(report["event_count"], 3)
        self.assertEqual(len(report["durations"]), 1)
        self.assertTrue(report["durations"][0]["matched_start"])
        self.assertEqual(report["durations"][0]["stage"], "shot-generation")
        self.assertEqual(len(report["unmatched_starts"]), 1)


if __name__ == "__main__":
    unittest.main()
