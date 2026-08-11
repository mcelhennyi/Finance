#!/usr/bin/env python3
"""Smoke-test the generic profile graph explorer UI.

The smoke test uses only stdlib HTTP calls against `./develop profiles`, so it
can run in skeleton consumers before browser automation dependencies exist.

Design: docs/design/profile-server-app.md
Traceability: T-FR-0004-08, T-FR-0004-09
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
    """Start the local profile server and verify explorer data contracts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--require-graph", action="store_true", help="Require non-empty actor graph data.")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    host = "127.0.0.1"
    port = free_port(host)
    scratch_root = repo_root / ".tmp"
    scratch_root.mkdir(exist_ok=True)
    state_dir = Path(tempfile.mkdtemp(prefix="profile-ui-smoke-", dir=scratch_root))
    graph_root = repo_root / "docs" / "design" / "actors"
    env = os.environ.copy()
    env.update(
        {
            "PROFILE_SERVER_HOST": host,
            "PROFILE_SERVER_PORT": str(port),
            "PROFILE_SERVER_STATE_DIR": str(state_dir),
            "PROFILE_GRAPH_ROOT": str(graph_root),
        }
    )

    base_url = f"http://{host}:{port}"
    try:
        run_develop(repo_root, env, ["profiles", "down"], check=False)
        run_develop(repo_root, env, ["profiles", "up"])

        html = wait_text(f"{base_url}/")
        require('data-profile-smoke="graph-explorer"' in html, "explorer smoke marker missing")
        require('id="graph-canvas"' in html, "graph canvas missing")
        require('id="actor-class-filter"' in html, "actor class filter missing")
        require('id="availability-filter"' in html, "availability filter missing")
        require('id="matrix-panel"' in html, "action matrix panel missing")
        require('id="gap-panel"' in html, "gap panel missing")
        require('id="extensions-panel"' in html, "extensions panel missing")
        require('id="node-modal"' in html, "structured detail modal missing")
        require('id="modal-back"' in html, "modal back button missing")
        require('id="modal-forward"' in html, "modal forward button missing")
        require("/api/document" in html, "document detail API is not used by the explorer")
        require("history.pushState" in html, "modal selections are not browser-history backed")
        require("popstate" in html, "modal browser back/forward handler missing")
        require("data-modal-node-id" in html, "modal relationship navigation links missing")
        require("ProfileGraphExplorer" in html, "explorer runtime missing")
        require("openNodeById" in html, "explorer public node-open API missing")
        require("openModalEntry" in html, "explorer public modal-open API missing")
        require("storyIntentSummary" in html, "story modal natural intent summary missing")
        require("isTraceOnlyIntent" in html, "trace-only intent replacement missing")
        require("Action Definition" in html, "action modal definition heading missing")
        require("Story Primitives" in html, "story primitive detail heading missing")
        require("require_authorization" in html, "authorization-shaped action explanation missing")
        require("Target / scope" in html, "plain-English primitive labels missing")
        require("data-list-kind" in html, "upper-right count list controls missing")
        require("openListModal" in html, "list/table modal renderer missing")
        require("modal-list-table" in html, "list modal table styling missing")

        summary = wait_json(f"{base_url}/api/summary")
        actor_graph = wait_json(f"{base_url}/api/profile-graph")
        index = wait_json(f"{base_url}/api/index")
        edges_payload = wait_json(f"{base_url}/api/edges")
        extensions = wait_json(f"{base_url}/api/extensions")

        actors = as_lookup(actor_graph.get("actors", []))
        stories = as_lookup(actor_graph.get("stories", []))
        index_actors = as_lookup(index.get("actors", {}))
        index_stories = as_lookup(index.get("stories", {}))
        actions = index.get("actions", {})
        edges = edges_payload.get("edges", [])
        require(isinstance(extensions.get("pages", []), list), "extensions pages payload is not a list")
        require(isinstance(extensions.get("metadata", {}), dict), "extensions metadata payload is not an object")
        assert_project_pages_served(base_url, graph_root, extensions)
        if args.require_graph:
            require(summary["counts"]["actors"] > 0, "summary reported no actors")
            require(summary["counts"]["stories"] > 0, "summary reported no stories")
            require(len(actors) > 0, "profile graph has no actors")
            require(len(stories) > 0, "profile graph has no stories")
            require(len(actions) > 0, "index has no actions")
            require(len(edges) > 0, "edges API has no typed edges")

        if actors:
            first_actor = next(iter(actors.values()))
            actor_path = index_actors.get(first_actor["id"], {}).get("path")
            require(actor_path, "actor path missing for Markdown details")
            actor_markdown = wait_json(f"{base_url}/api/markdown?path={quote(str(actor_path))}")
            require("---" in actor_markdown.get("markdown", ""), "actor markdown lacks frontmatter")
            actor_document = wait_json(f"{base_url}/api/document?path={quote(str(actor_path))}")
            require(actor_document.get("frontmatter", {}).get("id") == first_actor["id"], "actor document frontmatter is not queryable")
            require(actor_document.get("sections"), "actor document sections are empty")

        if stories:
            first_story = next(iter(stories.values()))
            story_path = index_stories.get(first_story["id"], {}).get("path")
            require(story_path, "story path missing for Markdown details")
            story_markdown = wait_json(f"{base_url}/api/markdown?path={quote(str(story_path))}")
            require("---" in story_markdown.get("markdown", ""), "story markdown lacks frontmatter")
            story_document = wait_json(f"{base_url}/api/document?path={quote(str(story_path))}")
            require(story_document.get("frontmatter", {}).get("id") == first_story["id"], "story document frontmatter is not queryable")
            require(story_document.get("sections"), "story document sections are empty")

        if edges:
            edge = edges[0]
            require(edge.get("type"), "edge type missing")
            require(edge.get("from") in stories, "edge origin story is not in profile graph")
            require(edge.get("to") in stories, "edge handler story is not in profile graph")
            require(edge.get("affected_actor"), "edge affected actor missing")

        if actions and actors:
            action_id, action = pick_matrix_action(actions)
            matrix_rows = build_matrix_rows(action_id, actors, stories)
            require(matrix_rows, "selected action matrix has no rows")
            require(
                any(row["availability"] != "missing" for row in matrix_rows),
                "selected action matrix has no available stories",
            )
            if args.require_graph:
                require(
                    len({row["availability"] for row in matrix_rows}) > 1,
                    "selected action matrix does not expose availability differences",
                )
                require(action.get("story_ids"), "index action lacks story ids")

        print(f"Profile server UI smoke OK: {base_url}/")
        return 0
    finally:
        run_develop(repo_root, env, ["profiles", "down"], check=False)
        shutil.rmtree(state_dir, ignore_errors=True)


def free_port(host: str) -> int:
    """Ask the OS for an available loopback port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def run_develop(
    repo_root: Path,
    env: dict[str, str],
    args: list[str],
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    """Run `./develop` and surface concise failures."""
    result = subprocess.run(
        [str(repo_root / "develop"), *args],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        timeout=20,
    )
    if check and result.returncode != 0:
        raise AssertionError(
            "develop command failed: "
            f"{args}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )
    return result


def wait_json(url: str, timeout_seconds: float = 6.0) -> dict[str, object]:
    """Poll a local JSON endpoint until the profile server is ready."""
    return json.loads(wait_text(url, timeout_seconds))


def wait_text(url: str, timeout_seconds: float = 6.0) -> str:
    """Poll a local text endpoint until the profile server is ready."""
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=1.0) as response:  # noqa: S310 - local smoke test URL
                return response.read().decode("utf-8")
        except Exception as exc:  # pragma: no cover - final assertion reports the last error.
            last_error = exc
            time.sleep(0.15)
    raise AssertionError(f"Timed out waiting for {url}: {last_error}")


def as_lookup(items: object) -> dict[str, dict[str, object]]:
    """Normalize list or mapping JSON records into an id-keyed lookup."""
    if isinstance(items, dict):
        return {str(key): value for key, value in items.items() if isinstance(value, dict)}
    if isinstance(items, list):
        return {
            str(item["id"]): item
            for item in items
            if isinstance(item, dict) and isinstance(item.get("id"), str)
        }
    return {}


def pick_matrix_action(actions: dict[str, object]) -> tuple[str, dict[str, object]]:
    """Choose the action with the broadest role/story matrix surface."""
    candidates = [
        (action_id, action)
        for action_id, action in actions.items()
        if isinstance(action_id, str) and isinstance(action, dict)
    ]
    candidates.sort(key=lambda item: len(item[1].get("story_ids", [])), reverse=True)
    require(bool(candidates), "no action records available")
    return candidates[0]


def build_matrix_rows(
    action_id: str,
    actors: dict[str, dict[str, object]],
    stories: dict[str, dict[str, object]],
) -> list[dict[str, str]]:
    """Build the same role/action availability matrix the browser renders."""
    rows: list[dict[str, str]] = []
    for actor_id, actor in sorted(actors.items(), key=lambda item: str(item[1].get("title", item[0]))):
        actor_stories = [
            story
            for story in stories.values()
            if story.get("actor_id") == actor_id and story.get("action_id") == action_id
        ]
        availability = "missing"
        if actor_stories:
            availability = ", ".join(sorted({str(story.get("availability", "unknown")) for story in actor_stories}))
        rows.append(
            {
                "actor": str(actor.get("title", actor_id)),
                "role": ", ".join(str(role) for role in actor.get("roles", [])) or "unassigned",
                "availability": availability,
            }
        )
    return rows


def assert_project_pages_served(
    base_url: str,
    graph_root: Path,
    extensions: dict[str, object],
) -> None:
    """Require any project-owned graph pages to be discoverable and Markdown-fetchable."""
    pages_dir = graph_root / "pages"
    if not pages_dir.is_dir():
        return

    expected_paths = sorted(
        path.relative_to(graph_root).as_posix()
        for path in pages_dir.glob("*.md")
        if path.is_file()
    )
    if not expected_paths:
        return

    pages = extensions.get("pages", [])
    require(isinstance(pages, list), "extensions pages payload is not a list")
    served_paths = {
        str(page.get("path"))
        for page in pages
        if isinstance(page, dict) and page.get("path")
    }
    missing_paths = sorted(set(expected_paths) - served_paths)
    require(not missing_paths, f"project pages were not discovered: {', '.join(missing_paths)}")

    first_path = expected_paths[0]
    page_markdown = wait_json(f"{base_url}/api/markdown?path={quote(first_path)}")
    markdown = page_markdown.get("markdown", "")
    require(isinstance(markdown, str) and markdown.strip(), "project page markdown response is empty")
    require("#" in markdown or "---" in markdown, "project page markdown lacks document structure")
    page_document = wait_json(f"{base_url}/api/document?path={quote(first_path)}")
    require(page_document.get("frontmatter", {}).get("id"), "project page document lacks queryable frontmatter")
    require(page_document.get("sections"), "project page document lacks parsed sections")


def require(condition: bool, message: str) -> None:
    """Raise a test-friendly assertion with one readable message."""
    if not condition:
        raise AssertionError(message)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"Profile server UI smoke failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
