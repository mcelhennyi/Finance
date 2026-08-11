#!/usr/bin/env python3
"""Smoke-test profile server project extensions and diagnostics.

Design: docs/design/profile-server-app.md
Traceability: T-FR-0004-09
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen


REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    """Exercise default, extended, and diagnostic graph roots."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    scratch = Path(tempfile.mkdtemp(prefix="profile-extension-smoke-", dir=repo_root / ".tmp"))
    try:
        no_pages_root = scratch / "no-pages"
        write_graph(no_pages_root)
        assert_clean_diagnose(repo_root, no_pages_root)
        no_pages_payload = serve_and_fetch_extensions(repo_root, no_pages_root)
        require(no_pages_payload["pages"] == [], "default graph should not report project pages")

        pages_root = scratch / "with-pages"
        write_graph(pages_root, with_page=True)
        assert_clean_diagnose(repo_root, pages_root)
        pages_payload = serve_and_fetch_extensions(repo_root, pages_root)
        require(len(pages_payload["pages"]) == 1, "custom page was not discovered")
        page = pages_payload["pages"][0]
        require(page["path"] == "pages/project-brief.md", "custom page path mismatch")
        require(page["links"], "custom page extension links missing")

        page_markdown = serve_and_fetch_markdown(repo_root, pages_root, page["path"])
        require("Project Brief" in page_markdown.get("markdown", ""), "custom page markdown missing")

        broken_root = scratch / "broken"
        write_graph(broken_root, missing_story=True)
        touch_newer(broken_root / "actors" / "actor-template.md")
        diagnose = run_develop(repo_root, broken_root, ["profiles", "diagnose"], check=False)
        require(diagnose.returncode != 0, "missing Markdown should make diagnose fail")
        require("missing_markdown_file" in diagnose.stdout, "missing Markdown diagnostic not reported")
        require("stale_generated_data" in diagnose.stdout, "stale generated data diagnostic not reported")

        broken_summary = serve_and_fetch_json(repo_root, broken_root, "/api/summary")
        codes = {item.get("code") for item in broken_summary.get("diagnostics_detail", [])}
        require("missing_markdown_file" in codes, "UI summary lacks missing Markdown diagnostic")
        require("stale_generated_data" in codes, "UI summary lacks stale data diagnostic")

        print("Profile server extension smoke OK: default pages, custom page, stale/missing diagnostics")
        return 0
    finally:
        shutil.rmtree(scratch, ignore_errors=True)


def write_graph(graph_root: Path, with_page: bool = False, missing_story: bool = False) -> None:
    """Write a tiny app-readable actor graph for extension smoke tests."""
    (graph_root / "actors").mkdir(parents=True)
    (graph_root / "stories").mkdir(parents=True)
    (graph_root / "README.md").write_text("# Test actor graph\n", encoding="utf-8")
    actor = {
        "actor_class": "direct_user",
        "id": "actor-template",
        "kind": "actor",
        "path": "actors/actor-template.md",
        "roles": ["member"],
        "seed_anchors": ["test-template"],
        "source_profile": "../seed-actor-profiles.md#template",
        "status": "active",
        "story_ids": ["us-template"],
        "title": "Template Actor",
    }
    story = {
        "action_id": "action-template",
        "actor_id": "actor-template",
        "actor_title": "Template Actor",
        "availability": "allowed",
        "id": "us-template",
        "kind": "user_story",
        "path": "stories/us-template.md" if not missing_story else "stories/missing-template.md",
        "priority": "must",
        "source_profile": "../seed-actor-profiles.md#template",
        "status": "active",
        "story_key": "story/template/default",
        "title": "Template story",
    }
    action = {
        "availability_by_actor": {"actor-template": ["allowed"]},
        "by_actor": {"actor-template": ["us-template"]},
        "story_ids": ["us-template"],
    }
    (graph_root / "actors" / "actor-template.md").write_text(
        "---\nid: actor-template\nkind: actor\ntitle: Template Actor\nroles: [member]\nstatus: active\n---\n# Template Actor\n",
        encoding="utf-8",
    )
    if not missing_story:
        (graph_root / "stories" / "us-template.md").write_text(
            "---\nid: us-template\nactor_id: actor-template\naction_id: action-template\navailability: allowed\n---\n# Template Story\n",
            encoding="utf-8",
        )
    (graph_root / "edges.jsonl").write_text("", encoding="utf-8")
    index = {
        "actions": {"action-template": action},
        "actors": {"actor-template": actor},
        "edges": [],
        "generated_at": "2026-07-21T00:00:00Z",
        "guiding_figures": {"instantiated": [], "suggested": []},
        "in_edges": {},
        "out_edges": {},
        "schema_version": 1,
        "source": "../seed-actor-profiles.md",
        "stories": {"us-template": story},
        "story_key_to_id": {"story/template/default": "us-template"},
    }
    actor_graph = {
        "actors": [{key: value for key, value in actor.items() if key != "path"}],
        "edges": [],
        "schema_version": 1,
        "source": "index.json",
        "source_profile": "../seed-actor-profiles.md",
        "stories": [{key: value for key, value in story.items() if key != "path"}],
    }
    (graph_root / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (graph_root / "actor-graph.json").write_text(json.dumps(actor_graph, indent=2), encoding="utf-8")

    if with_page:
        pages_dir = graph_root / "pages"
        pages_dir.mkdir()
        (pages_dir / "project-brief.md").write_text(
            "---\n"
            "id: page-project-brief\n"
            "title: Project Brief\n"
            "status: active\n"
            "routes:\n"
            "  - /member?role=member\n"
            "evidence_links:\n"
            "  - docs/design/seed-actor-profiles.md\n"
            "screenshots:\n"
            "  - docs/design/mockups/workspace-network-mock.html\n"
            "storybook_links:\n"
            "  - storybook://actor-profile\n"
            "test_reports:\n"
            "  - scripts/profile_server_extensions_smoke.py\n"
            "---\n"
            "# Project Brief\n\nCustom project context for the generic profile server.\n",
            encoding="utf-8",
        )


def touch_newer(path: Path) -> None:
    """Make a source file newer than generated JSON for stale diagnostics."""
    future = time.time() + 5
    os.utime(path, (future, future))


def assert_clean_diagnose(repo_root: Path, graph_root: Path) -> None:
    """Require diagnose to pass for a valid temporary graph."""
    result = run_develop(repo_root, graph_root, ["profiles", "diagnose"])
    require('"diagnostics_detail": []' in result.stdout, "expected no diagnostics for valid graph")


def serve_and_fetch_extensions(repo_root: Path, graph_root: Path) -> dict[str, object]:
    """Start the profile server and fetch /api/extensions."""
    return serve_and_fetch_json(repo_root, graph_root, "/api/extensions")


def serve_and_fetch_markdown(repo_root: Path, graph_root: Path, path: str) -> dict[str, object]:
    """Start the profile server and fetch one Markdown page."""
    return serve_and_fetch_json(repo_root, graph_root, f"/api/markdown?path={quote(path)}")


def serve_and_fetch_json(repo_root: Path, graph_root: Path, endpoint: str) -> dict[str, object]:
    """Run the profile server on a temporary port for one endpoint check."""
    host = "127.0.0.1"
    port = free_port(host)
    state_dir = Path(tempfile.mkdtemp(prefix="profile-extension-state-", dir=repo_root / ".tmp"))
    try:
        env = develop_env(graph_root, host, port, state_dir)
        run_develop(repo_root, graph_root, ["profiles", "down"], env=env, check=False)
        run_develop(repo_root, graph_root, ["profiles", "up"], env=env)
        return wait_json(f"http://{host}:{port}{endpoint}")
    finally:
        run_develop(repo_root, graph_root, ["profiles", "down"], env=develop_env(graph_root, host, port, state_dir), check=False)
        shutil.rmtree(state_dir, ignore_errors=True)


def free_port(host: str) -> int:
    """Ask the OS for an available loopback port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def run_develop(
    repo_root: Path,
    graph_root: Path,
    args: list[str],
    env: dict[str, str] | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    """Run `./develop` with PROFILE_GRAPH_ROOT pointed at a temp graph."""
    command_env = env or develop_env(graph_root, "127.0.0.1", free_port("127.0.0.1"), repo_root / ".tmp" / "profile-extension-diagnose")
    result = subprocess.run(
        [str(repo_root / "develop"), *args],
        cwd=repo_root,
        env=command_env,
        text=True,
        capture_output=True,
        timeout=20,
    )
    if check and result.returncode != 0:
        raise AssertionError(
            f"develop command failed: {args}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result


def develop_env(graph_root: Path, host: str, port: int, state_dir: Path) -> dict[str, str]:
    """Build an isolated profile server environment."""
    env = os.environ.copy()
    env.update(
        {
            "PROFILE_GRAPH_ROOT": str(graph_root),
            "PROFILE_SERVER_HOST": host,
            "PROFILE_SERVER_PORT": str(port),
            "PROFILE_SERVER_STATE_DIR": str(state_dir),
        }
    )
    return env


def wait_json(url: str, timeout_seconds: float = 6.0) -> dict[str, object]:
    """Poll a local JSON endpoint until the profile server is ready."""
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=1.0) as response:  # noqa: S310 - local smoke test URL
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # pragma: no cover - final assertion reports the last error.
            last_error = exc
            time.sleep(0.15)
    raise AssertionError(f"Timed out waiting for {url}: {last_error}")


def require(condition: bool, message: str) -> None:
    """Raise a test-friendly assertion with one readable message."""
    if not condition:
        raise AssertionError(message)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"Profile server extension smoke failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
