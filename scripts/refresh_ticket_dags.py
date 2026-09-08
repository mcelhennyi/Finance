#!/usr/bin/env python3
"""Refresh human-facing ticket DAGs without changing their stable graph ids.

The script reads canonical ticket titles and dependencies from feature-local
``tickets.md`` files, reads phase state from ``tasks/ticket-progress.md``, and
updates both feature-local and global Mermaid DAGs.  It is dependency-free so
``sync-skeleton`` can safely backfill old projects before they choose a stack.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass, field
import html
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from typing import Iterable


TICKET_ID_PATTERN = r"T-FR-\d{4}-\d{2}"
TICKET_ID_RE = re.compile(TICKET_ID_PATTERN)
FEATURE_ID_RE = re.compile(r"FR-(\d{4})")
PHASE_NODE_RE = re.compile(r"^TFR(\d{4})_(\d{2})_(TEST|DEV|VAL)$")
TICKET_NODE_RE = re.compile(r"^TFR(\d{4})_(\d{2})$")
LOCAL_NODE_RE = re.compile(r"^T(\d{1,2})$")
BARE_NODE_RE = re.compile(r"\b(TFR\d{4}_\d{2}(?:_(?:TEST|DEV|VAL))?|T\d{1,2})\b")
HEADING_RE = re.compile(
    rf"^###{{1,3}}\s+(?:\*\*)?({TICKET_ID_PATTERN})(?:\*\*)?"
    r"(?:\s*(?:—|--|-)\s*(.*?))?\s*$",
    re.MULTILINE,
)
FIELD_RE = re.compile(r"^\*\*([^*]+):\*\*\s*(.*)$", re.MULTILINE)

STATUS_START = "<!-- ticket-dag-status:start -->"
STATUS_END = "<!-- ticket-dag-status:end -->"
STATUS_LEGEND = [
    "Status colors: **green** means fully verified, **yellow** means work is underway,",
    "and **red** means outstanding or waiting on earlier work. The feature integration",
    "owner refreshes this graph before dispatch and after every wave.",
]
PHASE_LABELS = {
    "TEST": "Write the checks",
    "DEV": "Build the change",
    "VAL": "Verify it works",
}
LIFECYCLE_CLASSES = {
    "completed": "fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2px",
    "inDevelopment": "fill:#fef3c7,stroke:#d97706,color:#78350f,stroke-width:2px",
    "outstanding": "fill:#fee2e2,stroke:#dc2626,color:#7f1d1d,stroke-width:2px",
}
SHAPES = (
    ("[[", "]]"),
    ("[(", ")]"),
    ("((", "))"),
    ("{{", "}}"),
    ("[/", "/]"),
    ("[\\", "\\]"),
    ("[", "]"),
    ("(", ")"),
    ("{", "}"),
)
NODE_START_RE = re.compile(r"(?<![A-Za-z0-9_])([A-Za-z][A-Za-z0-9_]*)\s*")


@dataclass
class Ticket:
    """Canonical human-facing metadata and dependency state for one ticket."""

    ticket_id: str
    title: str = ""
    dependencies: tuple[str, ...] = ()
    summary: str = ""
    phases: dict[str, str] = field(default_factory=dict)


@dataclass
class MermaidResult:
    """A rewritten Mermaid body plus the ticket-to-node mapping it exposes."""

    lines: list[str]
    ticket_nodes: dict[str, list[str]]


def clean_prose(value: str) -> str:
    """Turn a small Markdown/HTML fragment into one readable prose line."""

    text = html.unescape(value)
    text = re.sub(r"<br\s*/?>|\\n", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = text.replace("**", "").replace("__", "").replace("`", "")
    return re.sub(r"\s+", " ", text).strip(' \t-—:;"')


def clean_inline(value: str) -> str:
    """Normalize a display label or compact table field."""

    return clean_prose(value).strip(".,")


def plain_summary(section: str) -> str:
    """Return at most two cold-readable sentences from an In plain English block."""

    match = re.search(
        r"^\*\*In plain English:\*\*\s*\n(.*?)(?=^\*\*[^*]+:\*\*|^###|\Z)",
        section,
        flags=re.MULTILINE | re.DOTALL,
    )
    if not match:
        return ""

    paragraphs = []
    for line in match.group(1).splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith(("- ", "* ", "|")):
            if paragraphs:
                break
            continue
        paragraphs.append(stripped)
    text = clean_prose(" ".join(paragraphs))
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(sentences[:2]).strip()


def parse_ticket_file(ticket_file: Path) -> dict[str, Ticket]:
    """Parse ticket headings, explicit fields, plain summaries, and dependencies."""

    text = ticket_file.read_text(encoding="utf-8")
    headings = list(HEADING_RE.finditer(text))
    tickets: dict[str, Ticket] = {}

    for index, heading in enumerate(headings):
        section_end = (
            headings[index + 1].start() if index + 1 < len(headings) else len(text)
        )
        section = text[heading.end() : section_end]
        ticket_id = heading.group(1)
        heading_title = clean_inline(heading.group(2) or "")
        fields = {
            clean_inline(key).lower(): clean_inline(value)
            for key, value in FIELD_RE.findall(section)
        }
        title = fields.get("title", "") or heading_title
        dependencies = tuple(TICKET_ID_RE.findall(fields.get("deps", "")))

        tickets[ticket_id] = Ticket(
            ticket_id=ticket_id,
            title=title,
            dependencies=dependencies,
            summary=plain_summary(section),
        )

    return tickets


def split_table_row(line: str) -> list[str]:
    """Split a simple Markdown table row while preserving cell text semantics."""

    stripped = line.strip()
    if not stripped.startswith("|"):
        return []
    return [cell.strip() for cell in stripped.strip("|").split("|")]


def normalized_header(cell: str) -> str:
    """Normalize a Markdown table header for tolerant column discovery."""

    return re.sub(r"[^a-z0-9]+", " ", clean_inline(cell).lower()).strip()


def is_separator_row(cells: list[str]) -> bool:
    """Recognize the alignment row immediately below a Markdown table header."""

    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells)


def is_done(value: str) -> bool:
    """Recognize completed phase cells without treating 'not done' as complete."""

    text = clean_inline(value).lower()
    if "not done" in text or "incomplete" in text:
        return False
    return bool(
        re.search(r"\b(done|complete|completed|passed)\b", text) or "✅" in value
    )


def is_active(value: str) -> bool:
    """Recognize phase cells that explicitly say work is underway."""

    text = clean_inline(value).lower()
    return bool(
        re.search(
            r"\b(in progress|active|running|testing|developing|integrating|started)\b",
            text,
        )
    )


def parse_progress_table(progress_file: Path, tickets: dict[str, Ticket]) -> set[str]:
    """Merge tracker titles and TEST/DEV/VAL cells into the ticket catalog."""

    if not progress_file.exists():
        return set()

    lines = progress_file.read_text(encoding="utf-8").splitlines()
    active_focus: set[str] = set()

    for line in lines:
        if "Active ticket" in line:
            active_focus.update(TICKET_ID_RE.findall(line))

    index = 0
    while index + 1 < len(lines):
        headers = split_table_row(lines[index])
        separator = split_table_row(lines[index + 1])
        if not headers or not is_separator_row(separator):
            index += 1
            continue

        normalized = [normalized_header(header) for header in headers]
        ticket_column = next(
            (
                i
                for i, name in enumerate(normalized)
                if name in {"ticket", "ticket id", "id"}
            ),
            None,
        )
        phase_columns = {
            phase: next(
                (i for i, name in enumerate(normalized) if name == phase.lower()), None
            )
            for phase in PHASE_LABELS
        }
        title_column = next(
            (i for i, name in enumerate(normalized) if name.startswith("title")), None
        )
        if ticket_column is None or any(
            column is None for column in phase_columns.values()
        ):
            index += 1
            continue

        row_index = index + 2
        while row_index < len(lines):
            cells = split_table_row(lines[row_index])
            if len(cells) != len(headers):
                break
            match = TICKET_ID_RE.search(cells[ticket_column])
            if match:
                ticket_id = match.group(0)
                ticket = tickets.setdefault(ticket_id, Ticket(ticket_id=ticket_id))
                if title_column is not None and not ticket.title:
                    ticket.title = clean_inline(cells[title_column])
                ticket.phases = {
                    phase: cells[column]
                    for phase, column in phase_columns.items()
                    if column is not None
                }
            row_index += 1
        index = max(row_index, index + 1)

    return active_focus


def load_catalog(root: Path) -> tuple[dict[str, Ticket], set[str]]:
    """Load all canonical feature tickets, then overlay global tracker state."""

    tickets: dict[str, Ticket] = {}
    history_root = root / "tasks" / "feature-history"
    if history_root.exists():
        for ticket_file in sorted(history_root.glob("FR-*/tickets.md")):
            for ticket_id, parsed in parse_ticket_file(ticket_file).items():
                existing = tickets.get(ticket_id)
                if existing and existing.title and not parsed.title:
                    parsed.title = existing.title
                tickets[ticket_id] = parsed

    active_focus = parse_progress_table(root / "tasks" / "ticket-progress.md", tickets)
    return tickets, active_focus


def feature_id_for_path(path: Path) -> str | None:
    """Infer the owning FR id for a feature-local DAG path."""

    for part in reversed(path.parts):
        match = FEATURE_ID_RE.search(part)
        if match:
            return f"FR-{match.group(1)}"
    return None


def ticket_for_node(
    node_id: str, label: str, feature_id: str | None
) -> tuple[str | None, str | None]:
    """Resolve a Mermaid node to its stable ticket id and optional phase."""

    direct = TICKET_ID_RE.search(html.unescape(label))
    phase_match = PHASE_NODE_RE.fullmatch(node_id)
    if phase_match:
        return f"T-FR-{phase_match.group(1)}-{phase_match.group(2)}", phase_match.group(
            3
        )
    if direct:
        phase = next(
            (name for name in PHASE_LABELS if re.search(rf"\b{name}\b", label)), None
        )
        return direct.group(0), phase

    ticket_match = TICKET_NODE_RE.fullmatch(node_id)
    if ticket_match:
        return f"T-FR-{ticket_match.group(1)}-{ticket_match.group(2)}", None
    local_match = LOCAL_NODE_RE.fullmatch(node_id)
    if local_match and feature_id:
        return f"T-{feature_id}-{int(local_match.group(1)):02d}", None
    return None, None


def fallback_title(label: str, ticket_id: str) -> str:
    """Recover readable legacy label text, or use a neutral ticket name."""

    candidate = clean_inline(label)
    candidate = candidate.replace(ticket_id, "")
    candidate = re.sub(r"\b(TEST|DEV|VAL)\b", "", candidate)
    candidate = re.sub(r"\bTFR\d{4}_\d{2}(?:_(?:TEST|DEV|VAL))?\b", "", candidate)
    candidate = re.sub(r"\s+", " ", candidate).strip(' ()-—:;,."')
    if re.search(r"[A-Za-z]{3,}", candidate):
        return candidate
    sequence = int(ticket_id.rsplit("-", 1)[1])
    return f"Ticket {sequence}"


def display_title(ticket_id: str, label: str, tickets: dict[str, Ticket]) -> str:
    """Prefer the canonical title while retaining a readable legacy fallback."""

    ticket = tickets.setdefault(ticket_id, Ticket(ticket_id=ticket_id))
    if not ticket.title:
        ticket.title = fallback_title(label, ticket_id)
    return ticket.title.rstrip(".!?")


def mermaid_label(ticket_id: str, phase: str | None, title: str) -> str:
    """Build a title-first Mermaid label with stable id and phase semantics."""

    safe_title = html.escape(html.unescape(title), quote=True)
    if phase:
        return f"{safe_title} — {PHASE_LABELS[phase]} ({ticket_id}, {phase})"
    return f"{safe_title} ({ticket_id})"


def find_shape(line: str, start: int) -> tuple[str, str] | None:
    """Return the Mermaid node-shape delimiters beginning at ``start``."""

    for opener, closer in SHAPES:
        if line.startswith(opener, start):
            return opener, closer
    return None


def rewrite_shaped_nodes(
    line: str,
    feature_id: str | None,
    tickets: dict[str, Ticket],
    seen_nodes: set[str],
    ticket_nodes: dict[str, list[str]],
) -> str:
    """Replace every shaped ticket node label on one Mermaid source line."""

    output: list[str] = []
    cursor = 0
    search_at = 0

    while True:
        match = NODE_START_RE.search(line, search_at)
        if not match:
            break
        node_id = match.group(1)
        shape_at = match.end()
        shape = find_shape(line, shape_at)
        if not shape:
            search_at = match.end()
            continue

        opener, closer = shape
        content_at = shape_at + len(opener)
        quote = (
            line[content_at]
            if content_at < len(line) and line[content_at] in {'"', "'"}
            else ""
        )
        label_at = content_at + (1 if quote else 0)
        terminator = f"{quote}{closer}" if quote else closer
        close_at = line.find(terminator, label_at)
        if close_at < 0:
            search_at = content_at
            continue

        label = line[label_at:close_at]
        ticket_id, phase = ticket_for_node(node_id, label, feature_id)
        if not ticket_id:
            search_at = close_at + len(terminator)
            continue

        title = display_title(ticket_id, label, tickets)
        replacement = (
            f'{node_id}{opener}"{mermaid_label(ticket_id, phase, title)}"{closer}'
        )
        output.append(line[cursor : match.start()])
        output.append(replacement)
        cursor = close_at + len(terminator)
        search_at = cursor
        seen_nodes.add(node_id)
        if node_id not in ticket_nodes[ticket_id]:
            ticket_nodes[ticket_id].append(node_id)

    output.append(line[cursor:])
    return "".join(output)


def label_bare_nodes(
    line: str,
    feature_id: str | None,
    tickets: dict[str, Ticket],
    seen_nodes: set[str],
    ticket_nodes: dict[str, list[str]],
) -> str:
    """Give first-use machine ticket nodes a readable label, leaving later refs bare."""

    if re.match(r"^\s*(?:class|classDef|style|linkStyle)\b", line):
        return line

    output: list[str] = []
    cursor = 0
    for match in BARE_NODE_RE.finditer(line):
        node_id = match.group(1)
        after = line[match.end() :].lstrip()
        ticket_id, phase = ticket_for_node(node_id, "", feature_id)
        if not ticket_id:
            continue
        if node_id not in ticket_nodes[ticket_id]:
            ticket_nodes[ticket_id].append(node_id)

        output.append(line[cursor : match.start()])
        output.append(node_id)
        if node_id not in seen_nodes and not after.startswith(("[", "(", "{")):
            title = display_title(ticket_id, "", tickets)
            output.append(f'["{mermaid_label(ticket_id, phase, title)}"]')
            seen_nodes.add(node_id)
        cursor = match.end()

    output.append(line[cursor:])
    return "".join(output)


def ticket_state(ticket: Ticket, active_focus: set[str]) -> str:
    """Map canonical phase evidence to the shared green/yellow/red class names."""

    phases = [ticket.phases.get(phase, "") for phase in PHASE_LABELS]
    if phases and all(is_done(value) for value in phases):
        return "completed"
    if (
        ticket.ticket_id in active_focus
        or any(is_active(value) for value in phases)
        or any(is_done(value) for value in phases)
    ):
        return "inDevelopment"
    return "outstanding"


def append_lifecycle_classes(
    lines: list[str],
    ticket_nodes: dict[str, list[str]],
    tickets: dict[str, Ticket],
    active_focus: set[str],
) -> list[str]:
    """Replace generated lifecycle classes with tracker-derived assignments."""

    cleaned = []
    for line in lines:
        if re.match(r"^\s*classDef\s+(completed|inDevelopment|outstanding)\b", line):
            continue
        if re.match(
            r"^\s*class\s+.+\s+(completed|inDevelopment|outstanding)\s*$", line
        ):
            continue
        cleaned.append(line)

    while cleaned and not cleaned[-1].strip():
        cleaned.pop()
    if cleaned:
        cleaned.append("")

    for class_name, definition in LIFECYCLE_CLASSES.items():
        cleaned.append(f"  classDef {class_name} {definition}")

    grouped: dict[str, list[str]] = defaultdict(list)
    for ticket_id, node_ids in sorted(ticket_nodes.items()):
        state = ticket_state(
            tickets.setdefault(ticket_id, Ticket(ticket_id=ticket_id)), active_focus
        )
        grouped[state].extend(node_ids)
    for class_name in LIFECYCLE_CLASSES:
        unique_nodes = list(dict.fromkeys(grouped[class_name]))
        if unique_nodes:
            cleaned.append(f"  class {','.join(unique_nodes)} {class_name}")
    return cleaned


def rewrite_mermaid(
    lines: list[str],
    feature_id: str | None,
    tickets: dict[str, Ticket],
    active_focus: set[str],
    feature_local: bool,
) -> MermaidResult:
    """Rewrite ticket nodes and, for feature DAGs, refresh lifecycle colors."""

    seen_nodes: set[str] = set()
    ticket_nodes: dict[str, list[str]] = defaultdict(list)
    rewritten: list[str] = []

    for line in lines:
        shaped = rewrite_shaped_nodes(
            line, feature_id, tickets, seen_nodes, ticket_nodes
        )
        rewritten.append(
            label_bare_nodes(shaped, feature_id, tickets, seen_nodes, ticket_nodes)
        )

    if feature_local and ticket_nodes:
        rewritten = append_lifecycle_classes(
            rewritten, ticket_nodes, tickets, active_focus
        )
    return MermaidResult(lines=rewritten, ticket_nodes=dict(ticket_nodes))


def completed_ticket_ids(
    tickets: dict[str, Ticket], active_focus: set[str]
) -> set[str]:
    """Return ticket ids whose TEST, DEV, and VAL cells are all complete."""

    return {
        ticket_id
        for ticket_id, ticket in tickets.items()
        if ticket_state(ticket, active_focus) == "completed"
    }


def readable_feature_name(path: Path, feature_id: str) -> str:
    """Derive a cold-readable feature name from its canonical directory slug."""

    feature_dir = next(
        (part for part in reversed(path.parts) if part.startswith(f"{feature_id}-")),
        feature_id,
    )
    slug = feature_dir[len(feature_id) :].lstrip("-")
    return slug.replace("-", " ").strip().capitalize() or feature_id


def next_ready_ticket(
    feature_tickets: list[Ticket],
    completed: set[str],
    active_focus: set[str],
) -> Ticket | None:
    """Choose the smallest unfinished ticket whose declared dependencies are done."""

    incomplete = [
        ticket for ticket in feature_tickets if ticket.ticket_id not in completed
    ]
    active = [
        ticket
        for ticket in incomplete
        if ticket_state(ticket, active_focus) == "inDevelopment"
    ]
    if active:
        return sorted(active, key=lambda ticket: ticket.ticket_id)[0]
    ready = [
        ticket
        for ticket in incomplete
        if all(dep in completed for dep in ticket.dependencies)
    ]
    return sorted(ready, key=lambda ticket: ticket.ticket_id)[0] if ready else None


def status_block(
    path: Path,
    feature_id: str | None,
    graph_ticket_ids: Iterable[str],
    tickets: dict[str, Ticket],
    active_focus: set[str],
) -> list[str]:
    """Build a two-sentence project + feature status note for one DAG."""

    completed = completed_ticket_ids(tickets, active_focus)
    defined_ids = sorted(tickets)
    total = len(defined_ids)
    done = len(completed)
    if total:
        open_count = total - done
        open_clause = (
            "one remains open or is not yet recorded as complete"
            if open_count == 1
            else f"{open_count} remain open or are not yet recorded as complete"
        )
        project_sentence = (
            f"Across the project, {done} of {total} defined tickets are fully verified; "
            f"{open_clause}."
        )
    else:
        project_sentence = "The project does not yet define any implementation tickets."

    if feature_id:
        feature_tickets = sorted(
            (
                ticket
                for ticket in tickets.values()
                if ticket.ticket_id.startswith(f"T-{feature_id}-")
            ),
            key=lambda ticket: ticket.ticket_id,
        )
        feature_done = sum(ticket.ticket_id in completed for ticket in feature_tickets)
        feature_name = readable_feature_name(path, feature_id)
        if feature_tickets and feature_done == len(feature_tickets):
            verified_clause = (
                "its one ticket is fully verified"
                if feature_done == 1
                else f"all {feature_done} tickets are fully verified"
            )
            scope_sentence = (
                f"{feature_name} ({feature_id}) is complete: {verified_clause}."
            )
        else:
            next_ticket = next_ready_ticket(feature_tickets, completed, active_focus)
            if next_ticket:
                activity = (
                    "work is underway on"
                    if ticket_state(next_ticket, active_focus) == "inDevelopment"
                    else "the next work that can start is"
                )
                next_title = display_title(next_ticket.ticket_id, "", tickets)
                scope_sentence = (
                    f"For {feature_name} ({feature_id}), {feature_done} of {len(feature_tickets)} tickets are fully verified; "
                    f"{activity} {next_title} ({next_ticket.ticket_id})."
                )
            else:
                scope_sentence = (
                    f"For {feature_name} ({feature_id}), {feature_done} of {len(feature_tickets)} tickets are fully verified; "
                    "the remaining work is waiting for earlier work to finish or for the progress record to be updated."
                )
    else:
        graph_ids = sorted(set(graph_ticket_ids))
        graph_done = sum(ticket_id in completed for ticket_id in graph_ids)
        feature_count = len({ticket_id[2:9] for ticket_id in graph_ids})
        ticket_noun = "ticket" if len(graph_ids) == 1 else "tickets"
        feature_noun = "feature" if feature_count == 1 else "features"
        scope_sentence = (
            f"This combined plan shows {len(graph_ids)} {ticket_noun} across {feature_count} {feature_noun}, "
            f"with {graph_done} fully verified."
        )

    return [
        STATUS_START,
        f"**Where things stand:** {project_sentence} {scope_sentence}",
        STATUS_END,
    ]


def feature_dag_first(text: str) -> str:
    """Move a feature's canonical Mermaid DAG directly below its H1 and legend."""

    newline = "\r\n" if "\r\n" in text else "\n"
    lines = text.replace("\r\n", "\n").splitlines()
    h1_index = next(
        (index for index, line in enumerate(lines) if re.match(r"^#\s+", line)), None
    )
    mermaid_index = next(
        (
            index
            for index, line in enumerate(lines)
            if line.strip().lower() == "```mermaid"
        ),
        None,
    )
    if h1_index is None or mermaid_index is None:
        return text

    close_index = mermaid_index + 1
    while close_index < len(lines) and lines[close_index].strip() != "```":
        close_index += 1
    if close_index >= len(lines):
        return text

    heading_index = mermaid_index
    previous = mermaid_index - 1
    while previous > h1_index and not lines[previous].strip():
        previous -= 1
    if previous > h1_index and re.match(
        r"^##+\s+.*\bDAG\b", lines[previous], flags=re.IGNORECASE
    ):
        heading_index = previous

    removal_end = close_index + 1
    status_index = removal_end
    while status_index < len(lines) and not lines[status_index].strip():
        status_index += 1
    if status_index < len(lines) and lines[status_index].strip() == STATUS_START:
        while status_index < len(lines) and lines[status_index].strip() != STATUS_END:
            status_index += 1
        removal_end = min(status_index + 1, len(lines))

    mermaid_block = lines[mermaid_index : close_index + 1]
    retained = lines[:heading_index] + lines[removal_end:]

    # Remove an earlier generated/status-color legend so reruns do not duplicate it.
    legend_start = None
    for index in range(h1_index + 1, min(len(retained), h1_index + 12)):
        if retained[index].strip().startswith("Status colors:"):
            legend_start = index
            break
    if legend_start is not None:
        legend_end = legend_start
        while legend_end < len(retained) and retained[legend_end].strip():
            legend_end += 1
        retained = retained[:legend_start] + retained[legend_end:]

    insertion = ["", *STATUS_LEGEND, "", "## Canonical DAG", "", *mermaid_block, ""]
    rebuilt = retained[: h1_index + 1] + insertion + retained[h1_index + 1 :]
    return newline.join(rebuilt).rstrip() + newline


def strip_existing_status(lines: list[str], start: int) -> int:
    """Skip a previously generated status block immediately after a Mermaid fence."""

    cursor = start
    while cursor < len(lines) and not lines[cursor].strip():
        cursor += 1
    if cursor >= len(lines) or lines[cursor].strip() != STATUS_START:
        return start

    while cursor < len(lines) and lines[cursor].strip() != STATUS_END:
        cursor += 1
    return min(cursor + 1, len(lines))


def rewrite_document(
    path: Path,
    tickets: dict[str, Ticket],
    active_focus: set[str],
) -> str:
    """Rewrite every ticket Mermaid block and its adjacent status note."""

    original = path.read_bytes()
    newline = "\r\n" if b"\r\n" in original else "\n"
    decoded = original.decode("utf-8")
    if path.name == "20-tickets-dag.md":
        decoded = feature_dag_first(decoded)
    text = decoded.replace("\r\n", "\n")
    lines = text.splitlines()
    feature_id = feature_id_for_path(path)
    feature_local = path.name == "20-tickets-dag.md"
    output: list[str] = []
    cursor = 0

    while cursor < len(lines):
        if lines[cursor].strip().lower() != "```mermaid":
            output.append(lines[cursor])
            cursor += 1
            continue

        close = cursor + 1
        while close < len(lines) and lines[close].strip() != "```":
            close += 1
        if close >= len(lines):
            output.extend(lines[cursor:])
            break

        body = lines[cursor + 1 : close]
        ticketish = bool(
            TICKET_ID_RE.search("\n".join(body))
            or any(
                PHASE_NODE_RE.fullmatch(token)
                for token in BARE_NODE_RE.findall("\n".join(body))
            )
            or (
                feature_local
                and any(
                    LOCAL_NODE_RE.fullmatch(token)
                    for token in BARE_NODE_RE.findall("\n".join(body))
                )
            )
        )
        if not ticketish:
            output.extend(lines[cursor : close + 1])
            cursor = close + 1
            continue

        result = rewrite_mermaid(body, feature_id, tickets, active_focus, feature_local)
        output.append(lines[cursor])
        output.extend(result.lines)
        output.append(lines[close])
        output.append("")
        output.extend(
            status_block(path, feature_id, result.ticket_nodes, tickets, active_focus)
        )
        output.append("")
        cursor = strip_existing_status(lines, close + 1)
        while cursor < len(lines) and not lines[cursor].strip():
            cursor += 1

    return newline.join(output).rstrip() + newline


def dependency_text(
    value: str, feature_id: str | None, tickets: dict[str, Ticket]
) -> str:
    """Render dependency cells as readable titles while retaining every stable id."""

    cleaned = clean_inline(value)
    if not cleaned or cleaned.lower() in {"none", "nothing", "n a", "—", "-"}:
        return "Nothing — can start immediately"

    parts: list[str] = []
    consumed: list[tuple[int, int]] = []

    def append_range(start_id: str, end_id: str) -> None:
        """Expand an inclusive same-feature range to explicit title + id entries."""

        start_prefix, start_sequence = start_id.rsplit("-", 1)
        end_prefix, end_sequence = end_id.rsplit("-", 1)
        if start_prefix != end_prefix or int(start_sequence) > int(end_sequence):
            for ticket_id in (start_id, end_id):
                parts.append(f"{display_title(ticket_id, '', tickets)} ({ticket_id})")
            return
        for sequence in range(int(start_sequence), int(end_sequence) + 1):
            ticket_id = f"{start_prefix}-{sequence:02d}"
            parts.append(f"{display_title(ticket_id, '', tickets)} ({ticket_id})")

    full_range_re = re.compile(
        rf"({TICKET_ID_PATTERN})\s*(?:through|to|[–—]|\s-\s)\s*({TICKET_ID_PATTERN})",
        flags=re.IGNORECASE,
    )
    for match in full_range_re.finditer(cleaned):
        append_range(match.group(1), match.group(2))
        consumed.append(match.span())

    if feature_id:
        for match in re.finditer(r"(?<!\d)(\d{2})\s*[–—-]\s*(\d{2})(?!\d)", cleaned):
            start_id = f"T-{feature_id}-{match.group(1)}"
            end_id = f"T-{feature_id}-{match.group(2)}"
            append_range(start_id, end_id)
            consumed.append(match.span())

    remainder = "".join(
        " " if any(start <= index < end for start, end in consumed) else char
        for index, char in enumerate(cleaned)
    )
    dependency_ids = TICKET_ID_RE.findall(remainder)
    if feature_id and not dependency_ids:
        for local in re.findall(r"(?<![A-Za-z0-9-])(\d{2})(?![A-Za-z0-9-])", remainder):
            dependency_ids.append(f"T-{feature_id}-{local}")

    for ticket_id in dict.fromkeys(dependency_ids):
        title = display_title(ticket_id, "", tickets)
        parts.append(f"{title} ({ticket_id})")
    return "; ".join(parts) if parts else value


def rewrite_dag_tables(text: str, path: Path, tickets: dict[str, Ticket]) -> str:
    """Humanize DAG table titles, dependency annotations, and available summaries."""

    lines = text.splitlines()
    feature_id = feature_id_for_path(path)
    in_fence = False
    index = 0

    while index + 1 < len(lines):
        if lines[index].lstrip().startswith("```"):
            in_fence = not in_fence
            index += 1
            continue
        if in_fence:
            index += 1
            continue

        headers = split_table_row(lines[index])
        separator = split_table_row(lines[index + 1])
        if not headers or not is_separator_row(separator):
            index += 1
            continue

        normalized = [normalized_header(header) for header in headers]
        ticket_column = next(
            (
                i
                for i, name in enumerate(normalized)
                if name in {"id", "ticket", "ticket id"}
            ),
            None,
        )
        title_column = next(
            (i for i, name in enumerate(normalized) if name.startswith("title")), None
        )
        dependency_column = next(
            (
                i
                for i, name in enumerate(normalized)
                if name.startswith("deps")
                or name.startswith("dependencies")
                or name.startswith("needs first")
            ),
            None,
        )
        summary_column = next(
            (i for i, name in enumerate(normalized) if "summary" in name), None
        )
        if ticket_column is None or title_column is None:
            index += 1
            continue

        changed_header = False
        if (
            dependency_column is not None
            and normalized[dependency_column] != "needs first title stable id"
        ):
            headers[dependency_column] = "Needs first (title + stable ID)"
            changed_header = True
        if changed_header:
            lines[index] = "| " + " | ".join(headers) + " |"

        row_index = index + 2
        while row_index < len(lines):
            cells = split_table_row(lines[row_index])
            if len(cells) != len(headers):
                break
            match = TICKET_ID_RE.search(cells[ticket_column])
            if not match:
                row_index += 1
                continue

            ticket_id = match.group(0)
            ticket = tickets.setdefault(ticket_id, Ticket(ticket_id=ticket_id))
            if ticket.title:
                cells[title_column] = ticket.title
            elif clean_inline(cells[title_column]):
                ticket.title = clean_inline(cells[title_column])
            if dependency_column is not None:
                cells[dependency_column] = dependency_text(
                    cells[dependency_column], feature_id, tickets
                )
            if summary_column is not None and ticket.summary:
                cells[summary_column] = ticket.summary
            lines[row_index] = "| " + " | ".join(cells) + " |"
            row_index += 1
        index = max(row_index, index + 1)

    newline = "\r\n" if "\r\n" in text else "\n"
    return newline.join(lines).rstrip() + newline


def discover_dags(root: Path) -> list[Path]:
    """Find every canonical global or feature-local ticket DAG in a consumer."""

    paths = []
    global_dag = root / "docs" / "design" / "tickets-initial.md"
    if global_dag.is_file():
        paths.append(global_dag)
    history_root = root / "tasks" / "feature-history"
    if history_root.exists():
        paths.extend(sorted(history_root.glob("FR-*/20-tickets-dag.md")))
    return paths


def dirty_paths(root: Path, paths: list[Path]) -> list[str]:
    """Return selected DAG paths that already contain uncommitted user work."""

    if not (root / ".git").exists() or not paths:
        return []
    relative = [path.relative_to(root).as_posix() for path in paths]
    result = subprocess.run(
        ["git", "-C", str(root), "status", "--porcelain", "--", *relative],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git status failed")
    return [line[3:] for line in result.stdout.splitlines() if len(line) >= 4]


def atomic_write(path: Path, text: str) -> None:
    """Replace one Markdown file atomically while preserving its permission bits."""

    mode = path.stat().st_mode
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="", dir=path.parent, delete=False
    ) as handle:
        handle.write(text)
        temporary = Path(handle.name)
    os.chmod(temporary, mode)
    os.replace(temporary, path)


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse the standalone refresh/check interface used by humans and sync."""

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path.cwd(), help="Consumer repository root."
    )
    parser.add_argument(
        "--check", action="store_true", help="Report drift without writing files."
    )
    parser.add_argument(
        "--require-clean",
        action="store_true",
        help="Refuse to change DAG files that already contain uncommitted work.",
    )
    parser.add_argument(
        "--changed-files",
        type=Path,
        help="Write changed repo-relative DAG paths, one per line, for sync staging.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Refresh all discovered DAGs and report an idempotent change summary."""

    args = parse_args(argv or sys.argv[1:])
    root = args.root.resolve()
    paths = discover_dags(root)
    if args.require_clean:
        dirty = dirty_paths(root, paths)
        if dirty:
            for relative in dirty:
                print(
                    f"ticket-dag-refresh: refusing dirty DAG: {relative}",
                    file=sys.stderr,
                )
            return 2

    tickets, active_focus = load_catalog(root)
    changed: list[str] = []
    for path in paths:
        original = path.read_bytes().decode("utf-8")
        rewritten = rewrite_document(path, tickets, active_focus)
        rewritten = rewrite_dag_tables(rewritten, path, tickets)
        if rewritten == original:
            continue
        relative = path.relative_to(root).as_posix()
        changed.append(relative)
        if not args.check:
            atomic_write(path, rewritten)
        print(
            f"ticket-dag-refresh: {'would update' if args.check else 'updated'} {relative}"
        )

    if args.changed_files:
        args.changed_files.write_text(
            "".join(f"{path}\n" for path in changed), encoding="utf-8"
        )
    if not changed:
        print("ticket-dag-refresh: all ticket DAGs are current")
    return 1 if args.check and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
