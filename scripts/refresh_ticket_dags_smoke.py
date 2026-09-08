#!/usr/bin/env python3
"""Smoke-test legacy DAG migration, status refresh, and clean-file safety."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile

import refresh_ticket_dags as refresh


def require(condition: bool, message: str) -> None:
    """Raise one focused assertion when the migration contract is violated."""

    if not condition:
        raise AssertionError(message)


def run(
    command: list[str], root: Path, check: bool = True
) -> subprocess.CompletedProcess[str]:
    """Run a deterministic local command and capture diagnostics for assertions."""

    return subprocess.run(
        command, cwd=root, check=check, capture_output=True, text=True
    )


def write_fixture(root: Path) -> None:
    """Create a small legacy consumer with feature and global ticket DAG variants."""

    feature_root = root / "tasks" / "feature-history" / "FR-0001-readable-work"
    feature_root.mkdir(parents=True)
    (root / "docs" / "design").mkdir(parents=True)

    (feature_root / "tickets.md").write_text(
        """# Tickets — FR-0001 readable work

### T-FR-0001-01 — Agree on the shared request format

**Title:** Agree on the shared request format
**Deps:** none

**In plain English:**
Write down the request and response shapes so both sides build against the same promise.

### T-FR-0001-02 — Let people submit a batch safely

**Title:** Let people submit a batch safely
**Deps:** T-FR-0001-01

**In plain English:**
Let a person submit several records together and see a clear result for each one.
""",
        encoding="utf-8",
    )
    (root / "tasks" / "ticket-progress.md").write_text(
        """# Ticket progress

| Field | Value |
|---|---|
| **Active ticket** | T-FR-0001-02 |

| Ticket | Title | TEST | DEV | VAL | Notes |
|---|---|---|---|---|---|
| T-FR-0001-01 | Agree on the shared request format | done | done | done | — |
| T-FR-0001-02 | Let people submit a batch safely | done | in progress | — | — |
""",
        encoding="utf-8",
    )

    legacy_feature = """# FR-0001 — Work breakdown and DAG

## Ticket table

| ID | Title | Type | Deps | Summary of change |
|---|---|---|---|---|
| T-FR-0001-01 | Old contract label | Story | none | Internal schema work. |
| T-FR-0001-02 | Old batch label | Story | T-FR-0001-01 | Internal batch work. |

## DAG

```mermaid
graph TD
  T01[T-FR-0001-01<br/>old_contract_label]
  T02[T-FR-0001-02<br/>old_batch_label]
  T01 --> T02
```

Legacy note stays below the ticket table.
"""
    (feature_root / "20-tickets-dag.md").write_bytes(
        legacy_feature.replace("\n", "\r\n").encode("utf-8")
    )

    (root / "docs" / "design" / "tickets-initial.md").write_text(
        """# Tickets — index and global DAG

```mermaid
graph LR
  TFR0001_01_TEST[TFR0001_01_TEST] --> TFR0001_01_DEV[TFR0001_01_DEV]
  TFR0001_01_DEV --> TFR0001_01_VAL[TFR0001_01_VAL]
  class TFR0001_01_TEST,TFR0001_01_DEV,TFR0001_01_VAL triadDone
```
""",
        encoding="utf-8",
    )


def initialize_git(root: Path) -> None:
    """Commit the legacy fixture so --require-clean can prove its safety gate."""

    run(["git", "init", "-b", "main"], root)
    run(["git", "add", "."], root)
    run(
        [
            "git",
            "-c",
            "user.name=Skeleton Smoke",
            "-c",
            "user.email=skeleton-smoke@example.invalid",
            "commit",
            "-m",
            "test: legacy ticket DAG fixture",
        ],
        root,
    )


def assert_first_refresh(root: Path, script: Path) -> None:
    """Require human labels, stable ids, status prose, colors, and CRLF preservation."""

    changed_files = root / "changed-files.txt"
    result = run(
        [
            sys.executable,
            str(script),
            "--root",
            str(root),
            "--require-clean",
            "--changed-files",
            str(changed_files),
        ],
        root,
    )
    require(
        "updated docs/design/tickets-initial.md" in result.stdout,
        "global DAG was not migrated",
    )
    require("20-tickets-dag.md" in result.stdout, "feature DAG was not migrated")

    feature_path = (
        root
        / "tasks"
        / "feature-history"
        / "FR-0001-readable-work"
        / "20-tickets-dag.md"
    )
    feature_bytes = feature_path.read_bytes()
    require(
        b"\n" not in feature_bytes.replace(b"\r\n", b""),
        "feature DAG lost its CRLF line endings",
    )
    feature = feature_bytes.decode("utf-8")
    require(
        feature.index("## Canonical DAG") < feature.index("## Ticket table"),
        "DAG was not moved to the top",
    )
    require(
        'T01["Agree on the shared request format (T-FR-0001-01)"]' in feature,
        "canonical title did not replace the legacy machine label",
    )
    require("T01 --> T02" in feature, "dependency edge changed during label migration")
    require("class T01 completed" in feature, "completed node did not turn green")
    require("class T02 inDevelopment" in feature, "active node did not turn yellow")
    require(
        "Needs first (title + stable ID)" in feature,
        "dependency header stayed machine-oriented",
    )
    require(
        "Agree on the shared request format (T-FR-0001-01)" in feature,
        "dependency annotation lost its title or stable id",
    )
    require(
        "Write down the request and response shapes so both sides build against the same promise."
        in feature,
        "legacy technical summary was not replaced by the canonical plain-English description",
    )
    require(
        "Across the project, 1 of 2 defined tickets" in feature,
        "project status sentence is missing",
    )
    require(
        "For Readable work (FR-0001), 1 of 2 tickets" in feature,
        "feature status sentence is missing",
    )
    status_line = next(
        line
        for line in feature.splitlines()
        if line.startswith("**Where things stand:**")
    )
    require(status_line.count(".") <= 3, "status explanation exceeds three sentences")

    global_dag = (root / "docs" / "design" / "tickets-initial.md").read_text(
        encoding="utf-8"
    )
    require(
        "Agree on the shared request format — Write the checks" in global_dag,
        "TEST phase is not readable",
    )
    require(
        "Agree on the shared request format — Build the change" in global_dag,
        "DEV phase is not readable",
    )
    require(
        "Agree on the shared request format — Verify it works" in global_dag,
        "VAL phase is not readable",
    )
    require("TFR0001_01_TEST" in global_dag, "stable Mermaid node id was removed")
    require("triadDone" in global_dag, "existing completion semantics were removed")

    changed = changed_files.read_text(encoding="utf-8").splitlines()
    require(
        len(changed) == 2,
        "changed-file list did not contain exactly both migrated DAGs",
    )


def assert_idempotent(root: Path, script: Path) -> None:
    """Require a second write and a check run to report no drift."""

    feature_path = (
        root
        / "tasks"
        / "feature-history"
        / "FR-0001-readable-work"
        / "20-tickets-dag.md"
    )
    before = feature_path.read_bytes()
    second = run([sys.executable, str(script), "--root", str(root)], root)
    require(
        "all ticket DAGs are current" in second.stdout, "second refresh was not a no-op"
    )
    require(
        feature_path.read_bytes() == before, "second refresh changed feature DAG bytes"
    )
    checked = run(
        [sys.executable, str(script), "--root", str(root), "--check"], root, check=False
    )
    require(checked.returncode == 0, "--check reported drift after a completed refresh")


def assert_status_can_advance(root: Path, script: Path) -> None:
    """Require tracker changes to regenerate prose and lifecycle colors in place."""

    progress_path = root / "tasks" / "ticket-progress.md"
    progress = progress_path.read_text(encoding="utf-8").replace(
        "| done | in progress | — | — |", "| done | done | done | — |"
    )
    progress_path.write_text(progress, encoding="utf-8")
    run([sys.executable, str(script), "--root", str(root)], root)

    feature_path = (
        root
        / "tasks"
        / "feature-history"
        / "FR-0001-readable-work"
        / "20-tickets-dag.md"
    )
    feature = feature_path.read_text(encoding="utf-8")
    require(
        "class T01,T02 completed" in feature,
        "completed feature nodes were not regrouped",
    )
    require(
        "is complete: all 2 tickets are fully verified" in feature,
        "feature completion prose stayed stale",
    )


def assert_dirty_file_refusal(root: Path, script: Path) -> None:
    """Require sync mode to leave an already edited DAG byte-for-byte untouched."""

    run(["git", "add", "."], root)
    run(
        [
            "git",
            "-c",
            "user.name=Skeleton Smoke",
            "-c",
            "user.email=skeleton-smoke@example.invalid",
            "commit",
            "-m",
            "test: refreshed ticket DAG fixture",
        ],
        root,
    )
    feature_path = (
        root
        / "tasks"
        / "feature-history"
        / "FR-0001-readable-work"
        / "20-tickets-dag.md"
    )
    with feature_path.open("a", encoding="utf-8") as handle:
        handle.write("\nHuman edit in progress.\n")
    before = feature_path.read_bytes()
    global_path = root / "docs" / "design" / "tickets-initial.md"
    global_before = global_path.read_bytes()
    progress_path = root / "tasks" / "ticket-progress.md"
    progress = progress_path.read_text(encoding="utf-8").replace(
        "| done | done | done | — |", "| done | in progress | — | — |"
    )
    progress_path.write_text(progress, encoding="utf-8")
    refused = run(
        [sys.executable, str(script), "--root", str(root), "--require-clean"],
        root,
        check=False,
    )
    require(
        refused.returncode == 2, "dirty DAG did not trigger the sync safety refusal"
    )
    require(
        "refusing dirty DAG" in refused.stderr, "dirty refusal did not name the reason"
    )
    require(
        feature_path.read_bytes() == before,
        "dirty DAG changed despite the safety refusal",
    )
    require(
        global_path.read_bytes() == global_before,
        "a clean DAG changed before the dirty-target preflight completed",
    )


def assert_skeleton_wiring(script_root: Path) -> None:
    """Require manifest delivery and sync invocation for the refresh and its smoke test."""

    manifest = (script_root / "skeleton.manifest").read_text(encoding="utf-8")
    sync_script = (script_root / "scripts" / "sync-skeleton.sh").read_text(
        encoding="utf-8"
    )
    require(
        "scripts/refresh_ticket_dags.py|scripts/refresh_ticket_dags.py" in manifest,
        "refresh script missing from manifest",
    )
    require(
        "scripts/refresh_ticket_dags_smoke.py|scripts/refresh_ticket_dags_smoke.py"
        in manifest,
        "refresh smoke test missing from manifest",
    )
    require(
        "refresh_ticket_dags.py" in sync_script and "--require-clean" in sync_script,
        "sync does not trigger safe DAG migration",
    )


def assert_dependency_rendering_is_stable() -> None:
    """Cover legacy ranges and already-rendered cross-feature dependencies."""

    tickets = {
        f"T-FR-0014-{sequence:02d}": refresh.Ticket(
            f"T-FR-0014-{sequence:02d}", title=f"Readable step {sequence}"
        )
        for sequence in range(3, 6)
    }
    ranged = refresh.dependency_text("03-05", "FR-0014", tickets)
    require(
        all(
            f"Readable step {sequence} (T-FR-0014-{sequence:02d})" in ranged
            for sequence in range(3, 6)
        ),
        "legacy dependency range did not expand to title + stable id entries",
    )
    require(
        refresh.dependency_text(ranged, "FR-0014", tickets) == ranged,
        "expanded dependency range was not idempotent",
    )

    foreign_id = "T-FR-0006-15"
    tickets[foreign_id] = refresh.Ticket(
        foreign_id, title="Publish the shared interface"
    )
    foreign = refresh.dependency_text(foreign_id, "FR-0001", tickets)
    require(
        refresh.dependency_text(foreign, "FR-0001", tickets) == foreign,
        "already-rendered cross-feature dependency was not idempotent",
    )
    require(
        "T-FR-0001-15" not in foreign,
        "a number in a dependency title invented a same-feature dependency",
    )


def main() -> int:
    """Run all migration scenarios in an isolated temporary consumer repository."""

    script_root = Path(__file__).resolve().parent.parent
    script = script_root / "scripts" / "refresh_ticket_dags.py"
    with tempfile.TemporaryDirectory(prefix="ticket-dag-refresh-") as temporary:
        root = Path(temporary)
        write_fixture(root)
        initialize_git(root)
        assert_first_refresh(root, script)
        assert_idempotent(root, script)
        assert_status_can_advance(root, script)
        assert_dirty_file_refusal(root, script)
    assert_skeleton_wiring(script_root)
    assert_dependency_rendering_is_stable()
    print("refresh-ticket-dags smoke: ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
