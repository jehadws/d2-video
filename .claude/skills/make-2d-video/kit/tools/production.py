"""Bounded shot planning, lease-based scheduling, and production telemetry.

The scheduler is cooperative: every worker must claim a batch and heartbeat its
lease. A worker that stops heartbeating loses its lease and its batch is requeued.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
import time
import uuid
from collections import defaultdict
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

SHOT_CALL = re.compile(r"""registerShot\s*\(\s*(['"])([^'"]+)\1""")
SHOT_ID = re.compile(r"^s\d{3,}$")


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    os.replace(temp, path)


def production_dir(project: Path) -> Path:
    return project / "build" / "production"


def scan_implementations(project: Path, expected_ids: set[str]) -> dict[str, Any]:
    """Find literal JS registrations and DSL JSON shots without executing project code."""
    implementations: dict[str, list[str]] = defaultdict(list)
    errors: list[str] = []
    scenes = project / "scenes"

    if scenes.is_dir():
        for path in sorted((scenes / "shots").rglob("*.js")) if (scenes / "shots").is_dir() else []:
            try:
                source = path.read_text(encoding="utf-8")
            except (OSError, UnicodeError) as exc:
                errors.append(f"{path.relative_to(project).as_posix()}: {exc}")
                continue
            for match in SHOT_CALL.finditer(source):
                shot_id = match.group(2).strip()
                if shot_id in expected_ids:
                    implementations[shot_id].append(path.relative_to(project).as_posix())

        visual_root = scenes / "visual"
        if visual_root.is_dir():
            for path in sorted(visual_root.rglob("*.json")):
                try:
                    payload = read_json(path)
                except (OSError, UnicodeError, json.JSONDecodeError) as exc:
                    errors.append(f"{path.relative_to(project).as_posix()}: invalid DSL JSON: {exc}")
                    continue
                shot_id = None
                if isinstance(payload, dict):
                    for key in ("id", "shotId", "shot_id"):
                        value = payload.get(key)
                        if isinstance(value, str) and value.strip():
                            shot_id = value.strip()
                            break
                if shot_id is None and path.stem in expected_ids:
                    shot_id = path.stem
                if shot_id in expected_ids:
                    implementations[shot_id].append(path.relative_to(project).as_posix())

    duplicates = {
        shot_id: paths for shot_id, paths in implementations.items() if len(paths) > 1
    }
    return {
        "implemented_ids": sorted(implementations),
        "missing_ids": sorted(expected_ids - set(implementations)),
        "duplicate_implementations": duplicates,
        "scan_errors": errors,
        "implementation_files": dict(implementations),
    }


def load_timeline(project: Path) -> list[dict[str, Any]]:
    source = project / "story" / "shots.json"
    if not source.is_file():
        raise FileNotFoundError(f"Missing shot timeline: {source}")
    payload = read_json(source)
    shots = payload.get("shots") if isinstance(payload, dict) else payload
    if not isinstance(shots, list) or not shots:
        raise ValueError("story/shots.json must contain a non-empty shots array")

    seen: set[str] = set()
    normalized = []
    for index, shot in enumerate(shots):
        if not isinstance(shot, dict):
            raise ValueError(f"Shot at index {index} must be an object")
        shot_id = str(shot.get("id", "")).strip()
        if not shot_id:
            raise ValueError(f"Shot at index {index} is missing an id")
        if shot_id in seen:
            raise ValueError(f"Duplicate shot id: {shot_id}")
        seen.add(shot_id)
        start, end = shot.get("start"), shot.get("end")
        if (not isinstance(start, (int, float)) or isinstance(start, bool)
                or not isinstance(end, (int, float)) or isinstance(end, bool) or end <= start):
            raise ValueError(f"Shot {shot_id} must have numeric start/end with end > start")
        normalized.append({"id": shot_id, "start": start, "end": end})
    return normalized


def build_plan(project: Path, batch_size: int, max_concurrency: int,
               include_existing: bool = False) -> dict[str, Any]:
    if batch_size < 1:
        raise ValueError("batch-size must be at least 1")
    if max_concurrency < 1:
        raise ValueError("max-concurrency must be at least 1")

    shots = load_timeline(project)
    expected_ids = {shot["id"] for shot in shots}
    scan = scan_implementations(project, expected_ids)
    implemented = set(scan["implemented_ids"])
    selected = shots if include_existing else [shot for shot in shots if shot["id"] not in implemented]

    batches = []
    for offset in range(0, len(selected), batch_size):
        group = selected[offset:offset + batch_size]
        number = len(batches) + 1
        batches.append({
            "id": f"batch-{number:03d}",
            "shot_ids": [shot["id"] for shot in group],
            "start": group[0]["start"],
            "end": group[-1]["end"],
            "shot_count": len(group),
            "write_scope": [
                f"one unique shot module or DSL file for {shot['id']}"
                for shot in group
            ],
        })

    return {
        "version": 2,
        "project": project.as_posix(),
        "created_at": time.time(),
        "timeline_shot_count": len(shots),
        "implemented_shot_count": len(implemented),
        "selected_shot_count": len(selected),
        "missing_shot_ids": scan["missing_ids"],
        "implemented_shot_ids": scan["implemented_ids"],
        "duplicate_implementations": scan["duplicate_implementations"],
        "scan_errors": scan["scan_errors"],
        "include_existing": include_existing,
        "batch_size": batch_size,
        "max_concurrency": max_concurrency,
        "batch_count": len(batches),
        "execution_contract": {
            "only_selected_missing_or_explicitly_included_shots_are_scheduled": True,
            "parallelize_only_disjoint_batch_write_scopes": True,
            "shared_assets_must_be_frozen_before_shot_batches": True,
            "validate_each_batch_before_accepting": True,
            "retry_only_failed_or_expired_batches": True,
            "workers_must_heartbeat_their_leases": True,
            "do_not_run_rendered_qa_per_shot": True,
        },
        "batches": batches,
    }


def append_event(project: Path, stage: str, status: str, batch: str | None,
                 note: str | None, worker: str | None = None) -> dict[str, Any]:
    if status not in {"started", "heartbeat", "completed", "failed", "expired"}:
        raise ValueError("invalid event status")
    event = {
        "event_id": str(uuid.uuid4()), "timestamp": time.time(),
        "stage": stage, "status": status, "batch": batch,
        "worker": worker, "note": note,
    }
    log_path = production_dir(project) / "events.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")
    return event


@contextmanager
def state_lock(project: Path, timeout: float = 5.0) -> Iterator[None]:
    """Cross-process lock using atomic directory creation; stale locks are recoverable."""
    lock = production_dir(project) / "state.lock"
    lock.parent.mkdir(parents=True, exist_ok=True)
    deadline = time.monotonic() + timeout
    while True:
        try:
            lock.mkdir()
            (lock / "owner").write_text(str(os.getpid()), encoding="ascii")
            break
        except FileExistsError:
            try:
                age = time.time() - lock.stat().st_mtime
                if age > 60:
                    shutil.rmtree(lock, ignore_errors=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() >= deadline:
                raise TimeoutError("Timed out waiting for production scheduler lock")
            time.sleep(0.05)
    try:
        yield
    finally:
        shutil.rmtree(lock, ignore_errors=True)


def load_state(project: Path) -> dict[str, Any]:
    path = production_dir(project) / "state.json"
    if not path.is_file():
        raise FileNotFoundError("No scheduler state. Run the plan command first.")
    return read_json(path)


def save_state(project: Path, state: dict[str, Any]) -> None:
    write_json(production_dir(project) / "state.json", state)


def expire_leases(state: dict[str, Any], now: float) -> list[dict[str, Any]]:
    expired = []
    for batch in state["batches"]:
        if batch["status"] == "running" and batch.get("lease_expires_at", 0) <= now:
            expired.append({"batch": batch["id"], "worker": batch.get("worker")})
            batch.update(status="pending", worker=None, token=None, lease_expires_at=None)
            batch["expired_attempts"] = batch.get("expired_attempts", 0) + 1
    return expired


def claim_batch(project: Path, worker: str, lease_seconds: int) -> dict[str, Any]:
    if not worker.strip():
        raise ValueError("worker must not be empty")
    if lease_seconds < 10:
        raise ValueError("lease-seconds must be at least 10")
    with state_lock(project):
        state = load_state(project)
        now = time.time()
        expired = expire_leases(state, now)
        for item in expired:
            append_event(project, "shot-generation", "expired", item["batch"],
                         "Worker lease expired; batch returned to pending", item["worker"])
        active = sum(batch["status"] == "running" for batch in state["batches"])
        if active >= state["max_concurrency"]:
            save_state(project, state)
            return {"claimed": False, "reason": "concurrency-limit", "active": active,
                    "max_concurrency": state["max_concurrency"]}
        batch = next((item for item in state["batches"] if item["status"] == "pending"), None)
        if batch is None:
            save_state(project, state)
            return {"claimed": False, "reason": "no-pending-batches", "active": active}
        token = str(uuid.uuid4())
        batch.update(status="running", worker=worker, token=token,
                     lease_expires_at=now + lease_seconds)
        batch["attempts"] = batch.get("attempts", 0) + 1
        save_state(project, state)
        append_event(project, "shot-generation", "started", batch["id"], None, worker)
        return {"claimed": True, "batch": batch, "token": token}


def update_lease(project: Path, batch_id: str, worker: str, token: str,
                 lease_seconds: int, finish_status: str | None = None,
                 note: str | None = None) -> dict[str, Any]:
    if lease_seconds < 10:
        raise ValueError("lease-seconds must be at least 10")
    if finish_status not in {None, "completed", "failed"}:
        raise ValueError("finish status must be completed or failed")
    with state_lock(project):
        state = load_state(project)
        batch = next((item for item in state["batches"] if item["id"] == batch_id), None)
        if batch is None:
            raise ValueError(f"Unknown batch: {batch_id}")
        if (batch["status"] != "running" or batch.get("worker") != worker
                or batch.get("token") != token):
            raise ValueError("Lease is no longer owned by this worker")
        if batch.get("lease_expires_at", 0) <= time.time():
            raise ValueError("Lease expired; claim the batch again")
        if finish_status:
            batch.update(status=finish_status, worker=None, token=None, lease_expires_at=None,
                         note=note)
            append_event(project, "shot-generation", finish_status, batch_id, note, worker)
        else:
            batch["lease_expires_at"] = time.time() + lease_seconds
            append_event(project, "shot-generation", "heartbeat", batch_id, note, worker)
        save_state(project, state)
        return {"batch": batch_id, "status": batch["status"],
                "lease_expires_at": batch.get("lease_expires_at")}


def summarize_events(project: Path) -> dict[str, Any]:
    log_path = production_dir(project) / "events.jsonl"
    if not log_path.is_file():
        return {"event_count": 0, "events": [], "unmatched_starts": []}
    events = []
    with log_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid telemetry JSON on line {line_number}: {exc}") from exc
    active: dict[tuple[str, str | None, str | None], list[dict[str, Any]]] = defaultdict(list)
    durations = []
    for event in events:
        key = (event.get("stage"), event.get("batch"), event.get("worker"))
        status = event.get("status")
        if status == "started":
            active[key].append(event)
        elif status in {"completed", "failed", "expired"}:
            starts = active[key]
            start = starts.pop(0) if starts else None
            durations.append({
                "stage": key[0], "batch": key[1], "worker": key[2],
                "status": status,
                "duration_seconds": round(max(0, event["timestamp"] - start["timestamp"]), 3)
                    if start else None,
                "matched_start": start is not None, "note": event.get("note"),
            })
    unmatched = [
        {"stage": key[0], "batch": key[1], "worker": key[2],
         "started_at": event["timestamp"]}
        for key, starts in active.items() for event in starts
    ]
    return {"event_count": len(events), "durations": durations,
            "unmatched_starts": unmatched}


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan and schedule bounded production batches.")
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", help="plan only missing shots by default")
    plan.add_argument("--project", required=True)
    plan.add_argument("--batch-size", type=int, default=10)
    plan.add_argument("--max-concurrency", type=int, default=3)
    plan.add_argument("--include-existing", action="store_true",
                      help="explicitly schedule every timeline shot, including implemented shots")

    claim = sub.add_parser("claim", help="claim one pending batch under the concurrency limit")
    claim.add_argument("--project", required=True)
    claim.add_argument("--worker", required=True)
    claim.add_argument("--lease-seconds", type=int, default=300)

    heartbeat = sub.add_parser("heartbeat", help="renew a worker batch lease")
    finish = sub.add_parser("finish", help="complete or fail a claimed batch")
    for command in (heartbeat, finish):
        command.add_argument("--project", required=True)
        command.add_argument("--batch", required=True)
        command.add_argument("--worker", required=True)
        command.add_argument("--token", required=True)
    heartbeat.add_argument("--lease-seconds", type=int, default=300)
    heartbeat.add_argument("--note")
    finish.add_argument("--status", required=True, choices=["completed", "failed"])
    finish.add_argument("--note")

    report = sub.add_parser("report", help="show scheduler state and telemetry")
    report.add_argument("--project", required=True)

    args = parser.parse_args()
    project = Path(args.project)
    try:
        if args.command == "plan":
            result = build_plan(project, args.batch_size, args.max_concurrency,
                                args.include_existing)
            state = {
                "version": 1, "max_concurrency": args.max_concurrency,
                "created_at": time.time(), "batches": [
                    {**batch, "status": "pending", "worker": None, "token": None,
                     "lease_expires_at": None, "attempts": 0, "expired_attempts": 0}
                    for batch in result["batches"]
                ],
            }
            write_json(production_dir(project) / "plan.json", result)
            write_json(production_dir(project) / "state.json", state)
            print(json.dumps({
                "timeline_shots": result["timeline_shot_count"],
                "already_implemented": result["implemented_shot_count"],
                "scheduled_shots": result["selected_shot_count"],
                "batches": result["batch_count"],
                "max_concurrency": args.max_concurrency,
                "missing_ids": result["missing_shot_ids"],
                "duplicate_implementations": result["duplicate_implementations"],
                "scan_errors": result["scan_errors"],
            }, indent=2))
        elif args.command == "claim":
            print(json.dumps(claim_batch(project, args.worker, args.lease_seconds), indent=2))
        elif args.command == "heartbeat":
            print(json.dumps(update_lease(project, args.batch, args.worker, args.token,
                                          args.lease_seconds, note=args.note), indent=2))
        elif args.command == "finish":
            print(json.dumps(update_lease(project, args.batch, args.worker, args.token,
                                          300, args.status, args.note), indent=2))
        else:
            with state_lock(project):
                state = load_state(project)
                expired = expire_leases(state, time.time())
                for item in expired:
                    append_event(project, "shot-generation", "expired", item["batch"],
                                 "Worker lease expired; batch returned to pending", item["worker"])
                save_state(project, state)
            print(json.dumps({"scheduler": state, "telemetry": summarize_events(project)},
                             indent=2, ensure_ascii=False))
    except (OSError, ValueError, KeyError, TimeoutError) as exc:
        print(f"Production tooling error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
