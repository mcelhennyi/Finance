#!/usr/bin/env python3
"""Local actor/profile graph server for the skeleton `./develop profiles` flow.

I/O contract:
- Reads only local files under PROFILE_GRAPH_ROOT, defaulting to docs/design/actors.
- Serves same-origin JSON, Markdown, and graph files for local inspection.
- Does not read credentials, call external services, or mutate project data.

Design: docs/design/profile-server-app.md
Traceability: T-FR-0004-07, T-FR-0004-08, T-FR-0004-09
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import UTC, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from profile_server_ui import render_profile_explorer_html


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GRAPH_ROOT = REPO_ROOT / "docs" / "design" / "actors"
GRAPH_JSON_FILES = ("index.json", "actor-graph.json")
GRAPH_TEXT_FILES = ("edges.jsonl", "README.md")
BASE_ACTOR_KEYS = {"actor_class", "id", "kind", "path", "roles", "seed_anchors", "source_profile", "status", "story_ids", "title"}
BASE_STORY_KEYS = {"action_id", "actor_id", "actor_title", "availability", "id", "kind", "path", "priority", "source_profile", "status", "story_key", "title"}
EXTENSION_LINK_KEYS = {
    "coverage",
    "evidence_links",
    "product_links",
    "route",
    "routes",
    "screenshots",
    "storybook",
    "storybook_links",
    "test_reports",
}


def main() -> int:
    """Parse local server options and run until interrupted."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--host",
        default=os.environ.get("PROFILE_SERVER_HOST", "127.0.0.1"),
        help="Bind host. Defaults to PROFILE_SERVER_HOST or 127.0.0.1.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PROFILE_SERVER_PORT", "9732")),
        help="Bind port. Defaults to PROFILE_SERVER_PORT or 9732.",
    )
    parser.add_argument(
        "--graph-root",
        type=Path,
        default=Path(os.environ.get("PROFILE_GRAPH_ROOT", DEFAULT_GRAPH_ROOT)),
        help="Actor graph root. Defaults to PROFILE_GRAPH_ROOT or docs/design/actors.",
    )
    parser.add_argument(
        "--watch",
        default=os.environ.get("PROFILE_SERVER_WATCH", "0"),
        help="Reserved reload flag surfaced in diagnostics for future watch mode.",
    )
    parser.add_argument(
        "--diagnose",
        action="store_true",
        help="Print graph diagnostics as JSON and exit without starting the server.",
    )
    args = parser.parse_args()

    graph_root = args.graph_root.expanduser()
    if not graph_root.is_absolute():
        graph_root = REPO_ROOT / graph_root

    if args.diagnose:
        summary = build_summary(graph_root.resolve(), str(args.watch))
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 1 if any(item.get("severity") == "error" for item in summary.get("diagnostics_detail", [])) else 0

    server = ProfileServer((args.host, args.port), ProfileRequestHandler)
    server.graph_root = graph_root.resolve()
    server.watch = str(args.watch)
    print(
        "Profile server listening at "
        f"http://{args.host}:{args.port}/ with graph root {server.graph_root}",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Profile server interrupted; shutting down.", flush=True)
    finally:
        server.server_close()
    return 0


class ProfileServer(ThreadingHTTPServer):
    """HTTP server with the actor graph root attached for request handlers."""

    graph_root: Path
    watch: str


class ProfileRequestHandler(BaseHTTPRequestHandler):
    """Serve local actor graph APIs and the dependency-free explorer UI."""

    server: ProfileServer

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        """Route local profile server GET requests."""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            self.send_landing_page()
        elif path == "/health":
            self.send_json({"status": "ok", "summary": build_summary(self.server.graph_root, self.server.watch)})
        elif path == "/api/summary":
            self.send_json(build_summary(self.server.graph_root, self.server.watch))
        elif path == "/api/index":
            self.send_graph_json("index.json")
        elif path == "/api/profile-graph":
            self.send_graph_json("actor-graph.json")
        elif path == "/api/edges":
            self.send_edges()
        elif path == "/api/extensions":
            self.send_json(discover_extensions(self.server.graph_root))
        elif path == "/api/markdown":
            requested = query.get("path", [""])[0]
            self.send_markdown(requested)
        elif path == "/api/document":
            requested = query.get("path", [""])[0]
            self.send_document(requested)
        elif path.startswith("/graph/"):
            self.send_graph_file(unquote(path.removeprefix("/graph/")))
        else:
            self.send_json({"error": "not_found", "path": path}, HTTPStatus.NOT_FOUND)

    def log_message(self, format: str, *args: object) -> None:
        """Write compact access logs for `./develop profiles logs`."""
        sys.stderr.write(
            "%s - - [%s] %s\n"
            % (self.address_string(), self.log_date_time_string(), format % args)
        )

    def send_landing_page(self) -> None:
        """Render the dependency-free profile graph explorer."""
        summary = build_summary(self.server.graph_root, self.server.watch)
        body = render_profile_explorer_html(summary)
        self.send_bytes(body.encode("utf-8"), "text/html; charset=utf-8")

    def send_graph_json(self, name: str) -> None:
        """Serve one graph JSON file, or a local diagnostic if it is absent."""
        path = safe_graph_path(self.server.graph_root, name)
        if path is None or not path.exists():
            self.send_json(
                {"error": "missing_graph_file", "file": name, "summary": build_summary(self.server.graph_root, self.server.watch)},
                HTTPStatus.NOT_FOUND,
            )
            return
        self.send_bytes(path.read_bytes(), "application/json; charset=utf-8")

    def send_edges(self) -> None:
        """Serve JSONL edges as a JSON array for browser consumers."""
        path = safe_graph_path(self.server.graph_root, "edges.jsonl")
        if path is None or not path.exists():
            self.send_json({"edges": [], "diagnostics": [f"Missing graph file: {self.server.graph_root / 'edges.jsonl'}"]})
            return
        self.send_json({"edges": read_jsonl(path)})

    def send_markdown(self, requested: str) -> None:
        """Serve a Markdown actor/story file inside the graph root."""
        path = safe_graph_path(self.server.graph_root, requested)
        if path is None or path.suffix.lower() != ".md" or not path.exists():
            self.send_json({"error": "missing_markdown", "path": requested}, HTTPStatus.NOT_FOUND)
            return
        document = parse_markdown_document(path, self.server.graph_root)
        self.send_json({"path": requested, "markdown": document["markdown"], **document})

    def send_document(self, requested: str) -> None:
        """Serve parsed Markdown data for UI cards and modal detail views."""
        path = safe_graph_path(self.server.graph_root, requested)
        if path is None or path.suffix.lower() != ".md" or not path.exists():
            self.send_json({"error": "missing_document", "path": requested}, HTTPStatus.NOT_FOUND)
            return
        self.send_json(parse_markdown_document(path, self.server.graph_root))

    def send_graph_file(self, requested: str) -> None:
        """Serve a raw local graph file while preventing graph-root escape."""
        path = safe_graph_path(self.server.graph_root, requested)
        if path is None or not path.exists() or not path.is_file():
            self.send_json({"error": "missing_graph_file", "path": requested}, HTTPStatus.NOT_FOUND)
            return
        if path.suffix.lower() == ".json":
            content_type = "application/json; charset=utf-8"
        elif path.suffix.lower() == ".md":
            content_type = "text/markdown; charset=utf-8"
        else:
            content_type = "text/plain; charset=utf-8"
        self.send_bytes(path.read_bytes(), content_type)

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        """Send a JSON response with no-store headers for local live reload safety."""
        self.send_bytes(
            json.dumps(payload, indent=2, sort_keys=True).encode("utf-8"),
            "application/json; charset=utf-8",
            status,
        )

    def send_bytes(
        self,
        payload: bytes,
        content_type: str,
        status: HTTPStatus = HTTPStatus.OK,
    ) -> None:
        """Send bytes with minimal security headers for a local-only tool."""
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(payload)


def build_summary(graph_root: Path, watch: str) -> dict[str, Any]:
    """Inspect local graph files and return counts plus diagnostics."""
    files = {}
    diagnostics: list[str] = []
    counts = {"actors": 0, "stories": 0, "actions": 0, "edges": 0}

    if not graph_root.exists():
        diagnostics.append(f"Graph root is missing: {graph_root}")
    elif not graph_root.is_dir():
        diagnostics.append(f"Graph root is not a directory: {graph_root}")

    for name in (*GRAPH_JSON_FILES, *GRAPH_TEXT_FILES):
        path = graph_root / name
        files[name] = file_status(path)
        if not path.exists():
            diagnostics.append(f"Missing graph file: {path}")

    index = read_json_if_present(graph_root / "index.json")
    if isinstance(index, dict):
        counts["actors"] = len(index.get("actors", []))
        counts["stories"] = len(index.get("stories", []))
        counts["actions"] = len(index.get("actions", {}))
        counts["edges"] = len(index.get("edges", []))
    else:
        actor_graph = read_json_if_present(graph_root / "actor-graph.json")
        if isinstance(actor_graph, dict):
            counts["actors"] = len(actor_graph.get("actors", []))
            counts["stories"] = len(actor_graph.get("stories", []))
            counts["edges"] = len(actor_graph.get("edges", []))
            counts["actions"] = len({story.get("action_id") for story in actor_graph.get("stories", []) if story.get("action_id")})

    if counts["edges"] == 0:
        edges_path = graph_root / "edges.jsonl"
        if edges_path.exists():
            counts["edges"] = len(read_jsonl(edges_path))

    diagnostics_detail = diagnose_graph(graph_root, index)
    seen = set(diagnostics)
    for item in diagnostics_detail:
        message = str(item.get("message", ""))
        if message and message not in seen:
            diagnostics.append(message)
            seen.add(message)

    return {
        "generated_at": datetime.now(UTC).isoformat(),
        "graph_root": str(graph_root),
        "watch": str(watch),
        "counts": counts,
        "files": files,
        "diagnostics": diagnostics,
        "diagnostics_detail": diagnostics_detail,
    }


def diagnose_graph(graph_root: Path, index: Any) -> list[dict[str, Any]]:
    """Return structured graph diagnostics for CLI and UI consumers."""
    diagnostics: list[dict[str, Any]] = []
    for name in GRAPH_JSON_FILES:
        path = graph_root / name
        if not path.exists():
            diagnostics.append(diagnostic("error", "missing_graph_file", f"Missing graph file: {path}", path))
        elif read_json_if_present(path) is None:
            diagnostics.append(diagnostic("error", "invalid_json", f"Invalid JSON graph file: {path}", path))

    for name in GRAPH_TEXT_FILES:
        path = graph_root / name
        if not path.exists():
            diagnostics.append(diagnostic("warning", "missing_graph_file", f"Missing graph file: {path}", path))

    if graph_root.is_dir():
        source_mtime = latest_source_mtime(graph_root)
        for generated_name in GRAPH_JSON_FILES:
            generated_path = graph_root / generated_name
            if generated_path.exists() and source_mtime and generated_path.stat().st_mtime + 1 < source_mtime:
                diagnostics.append(
                    diagnostic(
                        "warning",
                        "stale_generated_data",
                        f"Stale generated data: {generated_path} is older than actor/story sources",
                        generated_path,
                    )
                )

    if not isinstance(index, dict):
        return diagnostics

    stories = index.get("stories", {})
    actors = index.get("actors", {})
    if isinstance(stories, dict):
        story_ids = set(stories)
        story_records = stories.values()
    else:
        story_ids = {
            str(story.get("id"))
            for story in stories
            if isinstance(story, dict) and story.get("id")
        }
        story_records = stories if isinstance(stories, list) else []

    actor_records = actors.values() if isinstance(actors, dict) else actors if isinstance(actors, list) else []
    for record in actor_records:
        if isinstance(record, dict):
            append_missing_markdown_diagnostic(graph_root, record, diagnostics)

    for record in story_records:
        if isinstance(record, dict):
            append_missing_markdown_diagnostic(graph_root, record, diagnostics)

    for edge in index.get("edges", []):
        if not isinstance(edge, dict):
            continue
        origin = edge.get("from")
        handler = edge.get("to")
        if origin not in story_ids or handler not in story_ids:
            diagnostics.append(
                diagnostic(
                    "error",
                    "missing_edge_handler",
                    f"Missing edge handler: {origin or '<missing>'} -> {handler or '<missing>'}",
                )
            )
    return diagnostics


def append_missing_markdown_diagnostic(graph_root: Path, record: dict[str, Any], diagnostics: list[dict[str, Any]]) -> None:
    """Add a diagnostic when an indexed actor/story Markdown file is missing."""
    relative = record.get("path")
    if not isinstance(relative, str):
        return
    path = safe_graph_path(graph_root, relative)
    if path is None or not path.exists():
        diagnostics.append(
            diagnostic(
                "error",
                "missing_markdown_file",
                f"Missing Markdown file for {record.get('id', '<unknown>')}: {relative}",
                path,
            )
        )


def diagnostic(severity: str, code: str, message: str, path: Path | None = None) -> dict[str, Any]:
    """Build a structured diagnostic record."""
    payload: dict[str, Any] = {"severity": severity, "code": code, "message": message}
    if path is not None:
        payload["path"] = str(path)
    return payload


def discover_extensions(graph_root: Path) -> dict[str, Any]:
    """Discover optional project pages and extension metadata under the graph root."""
    index = read_json_if_present(graph_root / "index.json")
    pages = discover_pages(graph_root)
    metadata = discover_extension_metadata(index)
    return {
        "pages": pages,
        "metadata": metadata,
        "diagnostics": diagnose_graph(graph_root, index),
    }


def discover_pages(graph_root: Path) -> list[dict[str, Any]]:
    """Read optional Markdown pages from docs/design/actors/pages/*.md."""
    pages_dir = graph_root / "pages"
    if not pages_dir.is_dir():
        return []
    pages: list[dict[str, Any]] = []
    for path in sorted(pages_dir.glob("*.md")):
        frontmatter, body = read_markdown_frontmatter(path)
        relative = path.relative_to(graph_root).as_posix()
        pages.append(
            {
                "id": str(frontmatter.get("id") or path.stem),
                "title": str(frontmatter.get("title") or path.stem.replace("-", " ").title()),
                "status": str(frontmatter.get("status") or "active"),
                "path": relative,
                "summary": first_body_sentence(body),
                "frontmatter": frontmatter,
                "links": extension_links_from_record(frontmatter),
            }
        )
    return pages


def parse_markdown_document(path: Path, graph_root: Path) -> dict[str, Any]:
    """Return frontmatter and heading sections for app-readable UI rendering."""
    markdown = path.read_text(encoding="utf-8")
    frontmatter, body = read_markdown_frontmatter(path)
    return {
        "path": path.relative_to(graph_root).as_posix(),
        "title": str(frontmatter.get("title") or first_heading(body) or path.stem.replace("-", " ").title()),
        "frontmatter": frontmatter,
        "sections": parse_markdown_sections(body),
        "markdown": markdown,
    }


def parse_markdown_sections(body: str) -> list[dict[str, Any]]:
    """Parse a small Markdown subset into queryable heading/paragraph/list blocks."""
    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    paragraph: list[str] = []
    in_code = False

    def ensure_section() -> dict[str, Any]:
        nonlocal current
        if current is None:
            current = {"level": 1, "title": "Overview", "anchor": "overview", "paragraphs": [], "items": [], "code_blocks": []}
            sections.append(current)
        return current

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            ensure_section()["paragraphs"].append(" ".join(paragraph).strip())
            paragraph = []

    for raw_line in body.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped.startswith("```"):
            flush_paragraph()
            in_code = not in_code
            continue
        if in_code:
            ensure_section().setdefault("code_blocks", []).append(line)
            continue
        if not stripped:
            flush_paragraph()
            continue
        if stripped.startswith("#"):
            marker = stripped.split(" ", 1)[0]
            if set(marker) == {"#"} and len(stripped) > len(marker):
                flush_paragraph()
                title = stripped[len(marker) :].strip()
                current = {"level": min(len(marker), 6), "title": title, "anchor": slugify(title), "paragraphs": [], "items": [], "code_blocks": []}
                sections.append(current)
                continue
        if stripped.startswith("- "):
            flush_paragraph()
            ensure_section()["items"].append(stripped[2:].strip())
        else:
            paragraph.append(stripped)

    flush_paragraph()
    return sections


def first_heading(body: str) -> str | None:
    """Return the first Markdown heading in a document body."""
    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            marker = stripped.split(" ", 1)[0]
            if set(marker) == {"#"} and len(stripped) > len(marker):
                return stripped[len(marker) :].strip()
    return None


def slugify(value: str) -> str:
    """Build a compact URL-ish section anchor without adding a dependency."""
    slug = []
    previous_dash = False
    for char in value.lower():
        if char.isalnum():
            slug.append(char)
            previous_dash = False
        elif not previous_dash:
            slug.append("-")
            previous_dash = True
    return "".join(slug).strip("-") or "section"


def discover_extension_metadata(index: Any) -> dict[str, Any]:
    """Find project-specific metadata fields and links in actor/story indexes."""
    if not isinstance(index, dict):
        return {"actor_keys": [], "story_keys": [], "links": []}

    actor_records = record_values(index.get("actors"))
    story_records = record_values(index.get("stories"))
    actor_keys = sorted({key for record in actor_records for key in record if key not in BASE_ACTOR_KEYS})
    story_keys = sorted({key for record in story_records for key in record if key not in BASE_STORY_KEYS})
    links = []
    for record in (*actor_records, *story_records):
        links.extend(extension_links_from_record(record))
    return {"actor_keys": actor_keys, "story_keys": story_keys, "links": links}


def record_values(records: Any) -> list[dict[str, Any]]:
    """Normalize a list or mapping of records into dictionaries."""
    if isinstance(records, dict):
        return [value for value in records.values() if isinstance(value, dict)]
    if isinstance(records, list):
        return [value for value in records if isinstance(value, dict)]
    return []


def extension_links_from_record(record: dict[str, Any]) -> list[dict[str, str]]:
    """Extract known route/evidence/test/screenshot extension links."""
    links: list[dict[str, str]] = []
    for key in EXTENSION_LINK_KEYS:
        if key not in record:
            continue
        value = record[key]
        values = value if isinstance(value, list) else [value]
        for item in values:
            if item is None or item == "":
                continue
            links.append({"type": key, "target": str(item)})
    return links


def read_markdown_frontmatter(path: Path) -> tuple[dict[str, Any], str]:
    """Parse simple YAML-like frontmatter without adding a dependency."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}, text
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        return {}, text
    frontmatter = parse_frontmatter(parts[1])
    return frontmatter, parts[2].lstrip()


def parse_frontmatter(text: str) -> dict[str, Any]:
    """Parse scalar and list frontmatter values used by profile pages."""
    data: dict[str, Any] = {}
    current_key: str | None = None
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if current_key and stripped.startswith("- "):
            data.setdefault(current_key, []).append(clean_frontmatter_value(stripped[2:]))
            continue
        if ":" not in stripped:
            current_key = None
            continue
        key, value = stripped.split(":", 1)
        current_key = key.strip()
        value = value.strip()
        if value:
            data[current_key] = parse_frontmatter_value(value)
            current_key = None
        else:
            data[current_key] = []
    return data


def parse_frontmatter_value(value: str) -> Any:
    """Parse one simple frontmatter scalar or inline list."""
    if value.startswith("[") and value.endswith("]"):
        return [clean_frontmatter_value(item.strip()) for item in value[1:-1].split(",") if item.strip()]
    return clean_frontmatter_value(value)


def clean_frontmatter_value(value: str) -> str:
    """Strip matching quotes from a frontmatter value."""
    value = value.strip()
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    return value


def first_body_sentence(body: str) -> str:
    """Return a compact page summary for the extensions panel."""
    for line in body.splitlines():
        stripped = line.strip().lstrip("#").strip()
        if stripped:
            return stripped[:220]
    return ""


def latest_source_mtime(graph_root: Path) -> float | None:
    """Return the newest actor/story source mtime under the graph root."""
    candidates: list[Path] = []
    for folder_name in ("actors", "stories"):
        folder = graph_root / folder_name
        if folder.is_dir():
            candidates.extend(path for path in folder.rglob("*.md") if path.is_file())
    for filename in ("edges.jsonl", "README.md"):
        path = graph_root / filename
        if path.is_file():
            candidates.append(path)

    if not candidates:
        return None
    return max(path.stat().st_mtime for path in candidates)


def file_status(path: Path) -> dict[str, Any]:
    """Return existence metadata without reading file contents."""
    if not path.exists():
        return {"exists": False}
    stat = path.stat()
    return {
        "exists": True,
        "bytes": stat.st_size,
        "mtime": datetime.fromtimestamp(stat.st_mtime, UTC).isoformat(),
    }


def read_json_if_present(path: Path) -> Any:
    """Read JSON when present; return None for missing or invalid files."""
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    """Read JSON Lines with invalid rows preserved as diagnostics objects."""
    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            rows.append({"error": "invalid_jsonl", "line": line_number, "message": str(exc)})
    return rows


def safe_graph_path(graph_root: Path, requested: str) -> Path | None:
    """Resolve a graph-root relative path and reject traversal attempts."""
    if not requested or Path(requested).is_absolute():
        return None
    candidate = (graph_root / requested).resolve()
    try:
        candidate.relative_to(graph_root)
    except ValueError:
        return None
    return candidate


if __name__ == "__main__":
    raise SystemExit(main())
