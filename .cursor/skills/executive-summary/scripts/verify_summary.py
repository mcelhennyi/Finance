#!/usr/bin/env python3
"""Verify the path, traceability front matter, and BLUF shape of a summary."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path


REQUIRED_SCALARS = (
    "created_at",
    "branch",
    "full_commit",
    "project_root",
    "summary_scope",
)
FILE_PATTERN = re.compile(
    r"^(?P<stamp>\d{4}-\d{2}-\d{2}-\d{6})-"
    r"(?P<short>[0-9a-f]{7,12})-(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)\.md$"
)


def git(project_root: Path, *args: str) -> str:
    """Run one read-only Git query and return stripped stdout."""

    result = subprocess.run(
        ["git", "-C", str(project_root), *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def parse_front_matter(text: str) -> tuple[dict[str, str], list[str], str]:
    """Parse the deliberately small, quoted front-matter schema."""

    if not text.startswith("---\n") or "\n---\n" not in text[4:]:
        raise ValueError("missing YAML front matter")

    raw, body = text[4:].split("\n---\n", 1)
    scalars: dict[str, str] = {}
    evidence: list[str] = []
    in_evidence = False

    for line in raw.splitlines():
        if line == "evidence_basis:":
            in_evidence = True
            continue
        if in_evidence and line.startswith("  - "):
            evidence.append(json.loads(line[4:]))
            continue

        in_evidence = False
        match = re.fullmatch(r"([a-z_]+):\s*(.+)", line)
        if not match:
            raise ValueError(f"unsupported front-matter line: {line!r}")
        scalars[match.group(1)] = json.loads(match.group(2))

    return scalars, evidence, body


def verify(summary: Path, project_root: Path) -> None:
    """Reject a summary that violates the durable artifact contract."""

    root = Path(git(project_root, "rev-parse", "--show-toplevel")).resolve()
    resolved = summary.resolve()
    expected_parent = root / "tasks" / "executive-summaries"
    if resolved.parent != expected_parent:
        raise ValueError(f"summary must be directly under {expected_parent}")

    filename = FILE_PATTERN.fullmatch(resolved.name)
    if not filename:
        raise ValueError("filename does not contain local timestamp, short commit, and slug")

    scalars, evidence, body = parse_front_matter(resolved.read_text(encoding="utf-8"))
    missing = [key for key in REQUIRED_SCALARS if not scalars.get(key)]
    if missing:
        raise ValueError(f"missing required front-matter fields: {', '.join(missing)}")
    if not evidence or any(not isinstance(item, str) or not item.strip() for item in evidence):
        raise ValueError("evidence_basis must contain at least one non-empty string")

    created = datetime.fromisoformat(scalars["created_at"])
    if created.utcoffset() is None:
        raise ValueError("created_at must include the local UTC offset")
    if created.strftime("%Y-%m-%d-%H%M%S") != filename.group("stamp"):
        raise ValueError("filename timestamp does not match created_at")

    full_commit = scalars["full_commit"]
    if not re.fullmatch(r"[0-9a-f]{40}", full_commit):
        raise ValueError("full_commit must be a lowercase 40-character Git hash")
    if not full_commit.startswith(filename.group("short")):
        raise ValueError("filename short commit does not match full_commit")
    git(root, "cat-file", "-e", f"{full_commit}^{{commit}}")

    if Path(scalars["project_root"]).resolve() != root:
        raise ValueError("project_root does not match the containing Git repository")
    if not scalars["branch"].strip() or not scalars["summary_scope"].strip():
        raise ValueError("branch and summary_scope must be non-empty")

    if not body.lstrip().startswith("# Executive Summary"):
        raise ValueError("body must start with '# Executive Summary'")
    headings = re.findall(r"^## (.+)$", body, flags=re.MULTILINE)
    if not headings or headings[0] != "Bottom Line Up Front":
        raise ValueError("Bottom Line Up Front must be the first level-two section")
    if re.search(r"\b(?:TODO|TBD|FIXME)\b", body):
        raise ValueError("summary contains an unresolved placeholder")


def main() -> int:
    """Parse CLI arguments, verify one summary, and print its canonical path."""

    parser = argparse.ArgumentParser()
    parser.add_argument("summary", type=Path)
    parser.add_argument("--project-root", required=True, type=Path)
    args = parser.parse_args()

    try:
        verify(args.summary, args.project_root)
    except (OSError, ValueError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        parser.error(str(error))

    print(f"executive-summary: verified {args.summary.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
