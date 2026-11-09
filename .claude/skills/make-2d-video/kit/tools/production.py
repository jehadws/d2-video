"""Production planning and lightweight telemetry for make-2d-video.

Usage:
  python tools/production.py plan --project projects/demo --batch-size 10 --max-concurrency 3
  python tools/production.py record --project projects/demo --stage shot-generation --status started --batch batch-001
  python tools/production.py record --project projects/demo --stage shot-generation --status completed --batch batch-001
  python tools/production.py report --project projects/demo
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import uuid
from collections import defaultdict
from pathlib import Path
from typing import Any


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


def build_plan(project: Path, batch_size: int, max_concurrency: int) -> dict[str, Any]:
    if batch_size < 1:
        raise ValueError("batch-size must be at least 1")
    if max_concurrency < 1:
        raise ValueError("max-concurrency must be at least 1")

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
        if not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or end <= start:
            raise ValueError(f"Shot {shot_id} must have numeric start/end with end > start")
        normalized.append({"id": shot_id, "start": start, "end": end})

    batches = []
    for offset in range(0, len(normalized), batch_size):
        group = normalized[offset:offset + batch_size]
        number = len(batches) + 1
        batches.append({
            "id": f"batch-{number:03d}",
            "shot_ids": [shot["id"] for shot in group],
            "start": group[0]["start"],
            "end": group[-1]["end"],
            "shot_count": len(group),
            "write_scope": [
                f"scenes/visual/{shot['id']}.json or a uniquely named JS module registering {shot['id']}"
                for shot in group
            ],
        })

    return {
        "version": 1,
        "project": project.as_posix(),
        "created_at": time.time(),
        "shot_count": len(normalized),
        "batch_size": batch_size,
        "max_concurrency": max_concurrency,
        "batch_count": len(batches),
        "execution_contract": {
            "parallelize_only_disjoint_batch_write_scopes": True,
            "shared_assets_must_be_frozen_before_shot_batches": True,
            "validate_each_batch_before_accepting": True,
            "retry_only_failed_shots": True,
            "do_not_run_rendered_qa_per_shot": True,
        },
        "batches": batches,
    }


def append_event(project: Path, stage: str, status: str, batch: str | None, note: str | None) -> dict[str, Any]:
    if status not in {"started", "completed", "failed"}:
        raise ValueError("status must be started, completed, or failed")
    event = {
        "event_id": str(uuid.uuid4()),
        "timestamp": time.time(),
        "stage": stage,
        "status": status,
        "batch": batch,
        "note": note,
    }
    log_path = project / "build" / "production" / "events.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")
    return event


def summarize_events(project: Path) -> dict[str, Any]:
    log_path = project / "build" / "production" / "events.jsonl"
    if not log_path.is_file():
        return {"event_count": 0, "completed": [], "unmatched_starts": [], "failed": []}

    events = []
    with log_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid telemetry JSON on line {line_number}: {exc}") from exc

    active: dict[tuple[str, str | None], list[dict[str, Any]]] = defaultdict(list)
    completed, failed = [], []
    for event in events:
        key = (event.get("stage"), event.get("batch"))
        status = event.get("status")
        if status == "started":
            active[key].append(event)
        elif status in {"completed", "failed"}:
            starts = active[key]
            start = starts.pop(0) if starts else None
            item = {
                "stage": key[0],
                "batch": key[1],
                "duration_seconds": round(max(0, event["timestamp"] - start["timestamp"]), 3) if start else None,
                "matched_start": start is not None,
                "note": event.get("note"),
            }
            (completed if status == "completed" else failed).append(item)

    unmatched = [
        {"stage": key[0], "batch": key[1], "started_at": event["timestamp"]}
        for key, starts in active.items() for event in starts
    ]
    return {
        "event_count": len(events),
        "completed": completed,
        "failed": failed,
        "unmatched_starts": unmatched,
        "total_completed_seconds": round(sum(x["duration_seconds"] or 0 for x in completed), 3),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan shot batches and record production telemetry.")
    sub = parser.add_subparsers(dest="command", required=True)
    plan = sub.add_parser("plan", help="create a deterministic shot batch manifest")
    plan.add_argument("--project", required=True)
    plan.add_argument("--batch-size", type=int, default=10)
    plan.add_argument("--max-concurrency", type=int, default=3)

    record = sub.add_parser("record", help="append a production stage event")
    record.add_argument("--project", required=True)
    record.add_argument("--stage", required=True)
    record.add_argument("--status", required=True, choices=["started", "completed", "failed"])
    record.add_argument("--batch")
    record.add_argument("--note")

    report = sub.add_parser("report", help="summarize recorded production timings")
    report.add_argument("--project", required=True)

    args = parser.parse_args()
    project = Path(args.project)
    try:
        if args.command == "plan":
            result = build_plan(project, args.batch_size, args.max_concurrency)
            output = project / "build" / "production" / "plan.json"
            write_json(output, result)
            print(f"Production plan: {result['shot_count']} shots in {result['batch_count']} batches; max concurrency {result['max_concurrency']}.")
            print(output.as_posix())
        elif args.command == "record":
            event = append_event(project, args.stage, args.status, args.batch, args.note)
            print(json.dumps(event, ensure_ascii=False))
        else:
            result = summarize_events(project)
            output = project / "build" / "production" / "report.json"
            write_json(output, result)
            print(json.dumps(result, indent=2, ensure_ascii=False))
            print(output.as_posix())
    except (OSError, ValueError, KeyError) as exc:
        print(f"Production tooling error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
