"""HTML/JS profile graph explorer for the local actor profile server.

The UI is intentionally dependency-free so skeleton-derived projects can view
their actor graph before choosing a frontend stack or installing node packages.

Design: docs/design/profile-server-app.md
Traceability: T-FR-0004-08, T-FR-0004-09
"""

from __future__ import annotations

import json
from typing import Any


def render_profile_explorer_html(summary: dict[str, Any]) -> str:
    """Return the self-contained profile explorer HTML."""
    summary_json = json.dumps(summary, sort_keys=True).replace("</", "<\\/")
    return EXPLORER_HTML.replace("__PROFILE_SUMMARY_JSON__", summary_json)


EXPLORER_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Actor Profile Explorer</title>
  <style>
    :root {
      --bg: #f7f8fb;
      --ink: #17202a;
      --muted: #667085;
      --line: #d8dee9;
      --panel: #ffffff;
      --panel-2: #eef6f4;
      --accent: #0f766e;
      --accent-2: #b54708;
      --accent-3: #7c3aed;
      --danger: #b42318;
      --shadow: 0 18px 38px rgba(24, 39, 75, 0.12);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      height: 100%;
      overflow: hidden;
    }

    body {
      margin: 0;
      min-width: 320px;
      height: 100dvh;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button,
    input,
    select {
      color: inherit;
      font: inherit;
    }

    .app-shell {
      height: 100dvh;
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      overflow: hidden;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--line);
      background: #ffffff;
    }

    .brand {
      min-width: 0;
    }

    .brand h1 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0;
    }

    .brand p {
      margin: 0.2rem 0 0;
      color: var(--muted);
      font-size: 0.78rem;
      overflow-wrap: anywhere;
    }

    .counts {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .metric {
      min-width: 4.4rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfcfe;
      text-align: right;
    }

    button.metric {
      cursor: pointer;
    }

    button.metric:hover,
    button.metric:focus-visible {
      border-color: var(--accent);
      background: #eef6f4;
      outline: none;
    }

    .metric strong {
      display: block;
      font-size: 1rem;
    }

    .metric span {
      color: var(--muted);
      font-size: 0.68rem;
      text-transform: uppercase;
    }

    .toolbar {
      display: grid;
      grid-template-columns: repeat(6, minmax(8rem, 1fr));
      gap: 0.55rem;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid var(--line);
      background: #fdfefe;
    }

    .toolbar label {
      display: grid;
      gap: 0.22rem;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .toolbar select,
    .toolbar input {
      width: 100%;
      min-height: 2rem;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      padding: 0.35rem 0.45rem;
      font-size: 0.82rem;
    }

    .content {
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(22rem, 30rem);
      overflow: hidden;
    }

    .graph-region {
      position: relative;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      background:
        linear-gradient(rgba(15, 118, 110, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 118, 110, 0.06) 1px, transparent 1px),
        #f8fbfc;
      background-size: 34px 34px;
    }

    #graph-canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }

    #graph-canvas:active {
      cursor: grabbing;
    }

    .graph-hud {
      position: absolute;
      left: 0.9rem;
      bottom: 0.9rem;
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
      pointer-events: none;
    }

    .legend-pill {
      padding: 0.32rem 0.48rem;
      border: 1px solid rgba(23, 32, 42, 0.16);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.88);
      color: var(--muted);
      font-size: 0.72rem;
      box-shadow: var(--shadow);
    }

    .legend-pill::before {
      content: "";
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      margin-right: 0.35rem;
      border-radius: 50%;
      background: var(--dot, var(--accent));
      vertical-align: -0.05rem;
    }

    .detail-region {
      min-width: 0;
      max-height: 100%;
      overflow: auto;
      border-left: 1px solid var(--line);
      background: var(--panel);
    }

    .panel {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--line);
    }

    .panel h2,
    .panel h3 {
      margin: 0 0 0.55rem;
      font-size: 0.95rem;
      letter-spacing: 0;
    }

    .panel p {
      margin: 0.35rem 0;
      color: #344054;
      font-size: 0.86rem;
    }

    .muted {
      color: var(--muted);
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem;
    }

    .metadata-grid div,
    .list-row {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0.38rem 0.45rem;
      background: #fbfcfe;
      font-size: 0.78rem;
      overflow-wrap: anywhere;
    }

    button.list-row {
      width: 100%;
      margin: 0 0 0.35rem;
      text-align: left;
      cursor: pointer;
    }

    .metadata-grid strong,
    .list-row strong {
      display: block;
      color: var(--muted);
      font-size: 0.65rem;
      text-transform: uppercase;
    }

    .matrix {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .matrix th,
    .matrix td {
      border-bottom: 1px solid var(--line);
      padding: 0.35rem;
      text-align: left;
      vertical-align: top;
    }

    .matrix th {
      color: var(--muted);
      font-size: 0.67rem;
      text-transform: uppercase;
    }

    .modal-table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
    }

    .modal-list-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .modal-list-table th,
    .modal-list-table td {
      padding: 0.56rem 0.62rem;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }

    .modal-list-table th {
      color: var(--muted);
      font-size: 0.68rem;
      text-transform: uppercase;
      white-space: nowrap;
      background: #fbfcfe;
    }

    .modal-list-table tr:last-child td {
      border-bottom: 0;
    }

    .table-link {
      border: 0;
      padding: 0;
      background: transparent;
      color: var(--accent);
      font: inherit;
      font-weight: 700;
      text-align: left;
      cursor: pointer;
    }

    .table-link:hover,
    .table-link:focus-visible {
      text-decoration: underline;
      outline: none;
    }

    .badge {
      display: inline-block;
      margin: 0.08rem 0.12rem 0.08rem 0;
      padding: 0.14rem 0.32rem;
      border-radius: 4px;
      background: var(--panel-2);
      color: #135e57;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .badge.denied,
    .badge.missing {
      background: #fff1f0;
      color: var(--danger);
    }

    .badge.conditional,
    .badge.delegated {
      background: #fff6ed;
      color: var(--accent-2);
    }

    .markdown {
      max-height: 20rem;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0.6rem;
      background: #fbfcfe;
    }

    .markdown pre {
      overflow: auto;
      padding: 0.5rem;
      background: #101828;
      color: #f9fafb;
      border-radius: 6px;
    }

    .markdown code {
      overflow-wrap: anywhere;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgba(15, 23, 42, 0.48);
    }

    .modal-backdrop[hidden] {
      display: none;
    }

    .modal-dialog {
      width: min(72rem, 100%);
      max-height: calc(100dvh - 2rem);
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 28px 70px rgba(15, 23, 42, 0.28);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-bottom: 1px solid var(--line);
      background: #fbfcfe;
    }

    .modal-title-group {
      min-width: 0;
    }

    .modal-title-group strong {
      display: block;
      color: var(--muted);
      font-size: 0.68rem;
      text-transform: uppercase;
    }

    .modal-title-group h2 {
      margin: 0.15rem 0 0;
      font-size: clamp(1.1rem, 2vw, 1.6rem);
      letter-spacing: 0;
    }

    .modal-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex: 0 0 auto;
    }

    .modal-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .modal-nav-button,
    .modal-close {
      width: 2.1rem;
      height: 2.1rem;
      flex: 0 0 auto;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      font-weight: 800;
    }

    .modal-nav-button:disabled {
      cursor: not-allowed;
      opacity: 0.42;
    }

    .modal-body {
      min-height: 0;
      overflow: auto;
      padding: 1rem;
    }

    .modal-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 1rem;
      align-items: start;
      margin-bottom: 1rem;
    }

    .modal-hero p {
      margin: 0.35rem 0 0;
      color: #344054;
      line-height: 1.45;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      justify-content: flex-end;
    }

    .modal-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.8rem;
    }

    .detail-card,
    .section-card {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      padding: 0.75rem;
    }

    .detail-card h3,
    .section-card h3 {
      margin: 0 0 0.45rem;
      font-size: 0.9rem;
      letter-spacing: 0;
    }

    .modal-facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.38rem;
    }

    .modal-facts div {
      min-width: 0;
      padding: 0.42rem 0.48rem;
      border: 1px solid #e4e7ec;
      border-radius: 6px;
      background: #fbfcfe;
      overflow-wrap: anywhere;
      font-size: 0.78rem;
    }

    .modal-facts strong {
      display: block;
      margin-bottom: 0.1rem;
      color: var(--muted);
      font-size: 0.64rem;
      text-transform: uppercase;
    }

    .relationship-list {
      display: grid;
      gap: 0.35rem;
    }

    .relationship-item {
      width: 100%;
      border: 1px solid #e4e7ec;
      border-radius: 6px;
      background: #fbfcfe;
      padding: 0.45rem 0.5rem;
      text-align: left;
      cursor: pointer;
    }

    .relationship-item strong {
      display: block;
      color: var(--ink);
      font-size: 0.8rem;
    }

    .relationship-item span {
      color: var(--muted);
      font-size: 0.72rem;
    }

    .section-stack {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .section-card p,
    .section-card li {
      color: #344054;
      font-size: 0.86rem;
      line-height: 1.45;
    }

    .section-card p {
      margin: 0.35rem 0;
    }

    .section-card ul {
      margin: 0.35rem 0 0;
      padding-left: 1.15rem;
    }

    .empty-state {
      padding: 0.7rem;
      border: 1px dashed var(--line);
      border-radius: 6px;
      color: var(--muted);
      background: #fbfcfe;
      font-size: 0.82rem;
    }

    @media (max-width: 980px) {
      .toolbar {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .content {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(18rem, 52dvh) minmax(0, 1fr);
      }

      .detail-region {
        border-left: 0;
        border-top: 1px solid var(--line);
        max-height: none;
      }

      .graph-region {
        min-height: 0;
      }

      .modal-hero,
      .modal-grid,
      .section-stack {
        grid-template-columns: 1fr;
      }

      .chip-row {
        justify-content: flex-start;
      }
    }

    @media (max-width: 640px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }

      .counts {
        justify-content: flex-start;
      }

      .toolbar {
        grid-template-columns: 1fr;
      }

      .metadata-grid {
        grid-template-columns: 1fr;
      }

      .graph-region {
        min-height: 0;
      }

      .modal-facts {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app-shell" data-profile-smoke="graph-explorer">
    <header class="topbar">
      <div class="brand">
        <h1>Actor Profile Explorer</h1>
        <p id="graph-root-label"></p>
      </div>
      <div class="counts" id="count-strip"></div>
    </header>

    <section class="toolbar" aria-label="Graph filters">
      <label>Actor class
        <select id="actor-class-filter"></select>
      </label>
      <label>Role
        <select id="role-filter"></select>
      </label>
      <label>Action
        <select id="action-filter"></select>
      </label>
      <label>Availability
        <select id="availability-filter"></select>
      </label>
      <label>Edge type
        <select id="edge-type-filter"></select>
      </label>
      <label>Search
        <input id="search-filter" type="search" autocomplete="off">
      </label>
    </section>

    <main class="content">
      <section class="graph-region" aria-label="Actor story graph">
        <canvas id="graph-canvas"></canvas>
        <div class="graph-hud" id="graph-legend"></div>
      </section>

      <aside class="detail-region">
        <section class="panel" id="detail-panel">
          <h2 id="detail-title">Graph Overview</h2>
          <div id="detail-body" class="metadata-grid"></div>
          <div id="markdown-panel" class="markdown"></div>
        </section>
        <section class="panel" id="edge-panel">
          <h3>Selected Edge</h3>
          <div id="edge-detail" class="empty-state"></div>
        </section>
        <section class="panel" id="matrix-panel">
          <h3>Action Matrix</h3>
          <div id="matrix-body"></div>
        </section>
        <section class="panel" id="gap-panel">
          <h3>Gaps And Diagnostics</h3>
          <div id="gap-body"></div>
        </section>
        <section class="panel" id="extensions-panel">
          <h3>Project Pages</h3>
          <div id="extensions-body"></div>
        </section>
        <section class="panel" id="explanation-panel">
          <h3>Explanation</h3>
          <p id="explanation-body" class="muted"></p>
        </section>
      </aside>
    </main>
  </div>

  <div class="modal-backdrop" id="node-modal" hidden>
    <article class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <div class="modal-title-group">
          <strong id="modal-eyebrow">Selection</strong>
          <h2 id="modal-title">Actor Detail</h2>
        </div>
        <div class="modal-actions">
          <nav class="modal-nav" aria-label="Modal navigation">
            <button class="modal-nav-button" id="modal-back" type="button" aria-label="Back" title="Back" disabled>&lt;</button>
            <button class="modal-nav-button" id="modal-forward" type="button" aria-label="Forward" title="Forward" disabled>&gt;</button>
          </nav>
          <button class="modal-close" id="modal-close" type="button" aria-label="Close detail modal">x</button>
        </div>
      </header>
      <div class="modal-body" id="modal-body"></div>
    </article>
  </div>

  <script>
    window.__PROFILE_SUMMARY__ = __PROFILE_SUMMARY_JSON__;
  </script>
  <script>
    window.ProfileGraphExplorer = (() => {
      const state = {
        summary: window.__PROFILE_SUMMARY__,
        actorGraph: { actors: [], stories: [], edges: [] },
        index: { actors: {}, stories: {}, actions: {}, edges: [], guiding_figures: {} },
        extensions: { pages: [], metadata: {}, diagnostics: [] },
        edges: [],
        nodes: [],
        links: [],
        filteredNodes: [],
        filteredLinks: [],
        selectedNode: null,
        selectedEdge: null,
        hoverNode: null,
        documents: {},
        modalHistory: [],
        modalHistoryIndex: -1,
        modalLastFocus: null,
        pointerInCanvas: false,
        rotationX: -0.55,
        rotationY: 0.58,
        zoom: 1,
        dragging: false,
        dragStart: null,
        lastFrame: 0,
      };

      const colorByKind = {
        actor: "#0f766e",
        story: "#7c3aed",
        action: "#b54708",
        role: "#2563eb",
        guide: "#be185d",
      };

      const edgeColors = {
        handoff: "#0f766e",
        enables: "#2563eb",
        blocks: "#b42318",
        conflicts: "#b42318",
        variant_of: "#7c3aed",
        role: "#98a2b3",
        participates: "#667085",
        action: "#b54708",
        guide: "#be185d",
      };

      let canvas;
      let ctx;
      let resizeObserver;

      async function init() {
        canvas = document.getElementById("graph-canvas");
        ctx = canvas.getContext("2d");
        bindCanvas();
        bindModal();
        await loadData();
        buildFilters();
        buildGraph();
        applyFilters();
        renderOverview();
        resizeCanvas();
        startAnimation();
        await openModalFromLocationHash();
      }

      async function loadData() {
        const [summary, actorGraph, index, edgesPayload, extensions] = await Promise.all([
          fetchJson("/api/summary"),
          fetchJson("/api/profile-graph"),
          fetchJson("/api/index"),
          fetchJson("/api/edges"),
          fetchJson("/api/extensions"),
        ]);
        state.summary = summary;
        state.actorGraph = actorGraph;
        state.index = index;
        state.edges = Array.isArray(edgesPayload.edges) ? edgesPayload.edges : [];
        state.extensions = extensions;
        renderCounts();
        renderGaps();
      }

      async function fetchJson(url) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`${url} returned ${response.status}`);
        }
        return response.json();
      }

      function buildGraph() {
        const actors = Object.values(normalizeRecords(state.actorGraph.actors));
        const stories = Object.values(normalizeRecords(state.actorGraph.stories));
        const indexActors = normalizeRecords(state.index.actors);
        const indexStories = normalizeRecords(state.index.stories);
        const actions = state.index.actions || {};
        const roles = sortedUnique(actors.flatMap((actor) => actor.roles || []));
        const nodes = [];
        const links = [];
        const nodeById = new Map();

        roles.forEach((role, index) => addNode(nodeById, nodes, {
          id: `role:${role}`,
          kind: "role",
          title: role,
          roles: [role],
          status: "active",
          x: ringX(index, roles.length, 145),
          y: ringY(index, roles.length, 145),
          z: -90,
        }));

        Object.keys(actions).sort().forEach((actionId, index) => addNode(nodeById, nodes, {
          id: `action:${actionId}`,
          kind: "action",
          title: prettyAction(actionId),
          action_id: actionId,
          action: actions[actionId],
          status: "active",
          x: ringX(index, Object.keys(actions).length, 80),
          y: ringY(index, Object.keys(actions).length, 80),
          z: 90,
        }));

        actors.forEach((actor, index) => {
          const merged = { ...actor, ...(indexActors[actor.id] || {}) };
          addNode(nodeById, nodes, {
            ...merged,
            kind: "actor",
            x: ringX(index, actors.length, 285),
            y: ringY(index, actors.length, 285),
            z: classDepth(actor.actor_class),
          });
          (actor.roles || []).forEach((role) => links.push({
            id: `role:${actor.id}:${role}`,
            from: actor.id,
            to: `role:${role}`,
            type: "role",
          }));
        });

        stories.forEach((story, index) => {
          const actorIndex = Math.max(0, actors.findIndex((actor) => actor.id === story.actor_id));
          const actionIds = Object.keys(actions).sort();
          const actionIndex = Math.max(0, actionIds.indexOf(story.action_id));
          const merged = { ...story, ...(indexStories[story.id] || {}) };
          const radius = 185 + ((index % 5) * 12);
          addNode(nodeById, nodes, {
            ...merged,
            kind: "story",
            title: story.title || story.story_key || story.id,
            x: ringX(actorIndex + actionIndex, Math.max(actors.length, actionIds.length, 1), radius),
            y: ringY(actorIndex + (actionIndex * 2), Math.max(actors.length, actionIds.length, 1), radius),
            z: -25 + ((index % 7) * 14),
          });
          links.push({ id: `actor-story:${story.actor_id}:${story.id}`, from: story.actor_id, to: story.id, type: "participates" });
          links.push({ id: `story-action:${story.id}:${story.action_id}`, from: story.id, to: `action:${story.action_id}`, type: "action" });
        });

        const guiding = state.index.guiding_figures || {};
        const guides = [...(guiding.instantiated || []), ...(guiding.suggested || [])];
        guides.forEach((guide, index) => {
          addNode(nodeById, nodes, {
            ...guide,
            id: `guide:${guide.id}`,
            kind: "guide",
            title: guide.title || guide.id,
            status: guide.status || "suggested",
            x: ringX(index, Math.max(guides.length, 1), 360),
            y: ringY(index, Math.max(guides.length, 1), 360),
            z: 145,
          });
        });

        state.edges.forEach((edge, index) => links.push({
          ...edge,
          id: `story-edge:${index}:${edge.from}:${edge.to}`,
          from: edge.from,
          to: edge.to,
          type: edge.type || "related",
        }));

        state.nodes = nodes;
        state.links = links.filter((link) => nodeById.has(link.from) && nodeById.has(link.to));
      }

      function addNode(nodeById, nodes, node) {
        nodeById.set(node.id, node);
        nodes.push(node);
      }

      function buildFilters() {
        const actors = Object.values(normalizeRecords(state.actorGraph.actors));
        const stories = Object.values(normalizeRecords(state.actorGraph.stories));
        const edgeTypes = sortedUnique([...state.edges.map((edge) => edge.type), "role", "participates", "action"]);
        populateSelect("actor-class-filter", ["all", ...sortedUnique(actors.map((actor) => actor.actor_class).filter(Boolean))]);
        populateSelect("role-filter", ["all", ...sortedUnique(actors.flatMap((actor) => actor.roles || []))]);
        populateSelect("action-filter", ["all", ...Object.keys(state.index.actions || {}).sort()]);
        populateSelect("availability-filter", ["all", ...sortedUnique(stories.map((story) => story.availability).filter(Boolean)), "missing"]);
        populateSelect("edge-type-filter", ["all", ...edgeTypes.filter(Boolean)]);
        ["actor-class-filter", "role-filter", "action-filter", "availability-filter", "edge-type-filter", "search-filter"].forEach((id) => {
          document.getElementById(id).addEventListener("input", () => {
            applyFilters();
            renderMatrix();
            renderGaps();
          });
        });
      }

      function populateSelect(id, values) {
        const select = document.getElementById(id);
        select.innerHTML = values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(labelFor(value))}</option>`).join("");
      }

      function applyFilters() {
        const actorClass = valueOf("actor-class-filter");
        const role = valueOf("role-filter");
        const action = valueOf("action-filter");
        const availability = valueOf("availability-filter");
        const edgeType = valueOf("edge-type-filter");
        const search = valueOf("search-filter").toLowerCase();
        const visible = new Set();

        state.nodes.forEach((node) => {
          let ok = true;
          if (actorClass !== "all" && node.kind === "actor") ok = node.actor_class === actorClass;
          if (role !== "all" && node.kind === "actor") ok = (node.roles || []).includes(role);
          if (role !== "all" && node.kind === "role") ok = node.id === `role:${role}`;
          if (action !== "all" && node.kind === "story") ok = node.action_id === action;
          if (action !== "all" && node.kind === "action") ok = node.action_id === action;
          if (availability !== "all" && node.kind === "story") ok = node.availability === availability;
          if (search && !searchBlob(node).includes(search)) ok = false;
          if (ok) visible.add(node.id);
        });

        const expanded = new Set(visible);
        state.links.forEach((link) => {
          if (visible.has(link.from) || visible.has(link.to)) {
            expanded.add(link.from);
            expanded.add(link.to);
          }
        });

        state.filteredNodes = state.nodes.filter((node) => expanded.has(node.id));
        state.filteredLinks = state.links.filter((link) => {
          const typeOk = edgeType === "all" || link.type === edgeType;
          return typeOk && expanded.has(link.from) && expanded.has(link.to);
        });
      }

      function draw(timestamp) {
        if (!ctx) return;
        const elapsed = Math.min(32, timestamp - state.lastFrame || 16);
        state.lastFrame = timestamp;
        if (!state.dragging && !state.pointerInCanvas) state.rotationY += elapsed * 0.00008;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const projected = projectNodes();
        drawLinks(projected);
        drawNodes(projected);
        requestAnimationFrame(draw);
      }

      function startAnimation() {
        requestAnimationFrame(draw);
      }

      function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(320, Math.floor(rect.width * ratio));
        canvas.height = Math.max(260, Math.floor(rect.height * ratio));
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      function bindCanvas() {
        resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas);
        canvas.addEventListener("pointerdown", (event) => {
          state.dragging = true;
          state.dragStart = { x: event.clientX, y: event.clientY, rx: state.rotationX, ry: state.rotationY };
          canvas.setPointerCapture(event.pointerId);
        });
        canvas.addEventListener("pointerenter", () => {
          state.pointerInCanvas = true;
        });
        canvas.addEventListener("pointerleave", () => {
          state.pointerInCanvas = false;
          state.hoverNode = null;
        });
        canvas.addEventListener("pointermove", (event) => {
          if (state.dragging && state.dragStart) {
            state.rotationY = state.dragStart.ry + (event.clientX - state.dragStart.x) * 0.006;
            state.rotationX = clamp(state.dragStart.rx + (event.clientY - state.dragStart.y) * 0.006, -1.35, 1.35);
          } else {
            updateHover(event);
          }
        });
        canvas.addEventListener("pointerup", (event) => {
          state.dragging = false;
          state.dragStart = null;
          canvas.releasePointerCapture(event.pointerId);
        });
        canvas.addEventListener("click", selectFromPointer);
        canvas.addEventListener("wheel", (event) => {
          event.preventDefault();
          state.zoom = clamp(state.zoom - event.deltaY * 0.001, 0.55, 2.2);
        }, { passive: false });
      }

      function bindModal() {
        const modal = document.getElementById("node-modal");
        document.getElementById("modal-close").addEventListener("click", closeModal);
        document.getElementById("modal-back").addEventListener("click", () => navigateModalBack());
        document.getElementById("modal-forward").addEventListener("click", () => navigateModalForward());
        modal.addEventListener("click", (event) => {
          if (event.target === modal) closeModal();
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape" && !modal.hidden) closeModal();
          if ((event.altKey || event.metaKey) && event.key === "ArrowLeft" && !modal.hidden) navigateModalBack();
          if ((event.altKey || event.metaKey) && event.key === "ArrowRight" && !modal.hidden) navigateModalForward();
        });
        document.getElementById("modal-body").addEventListener("click", (event) => {
          const nodeButton = event.target.closest("[data-modal-node-id]");
          if (nodeButton) {
            event.preventDefault();
            navigateModalNode(nodeButton.getAttribute("data-modal-node-id"));
            return;
          }
          const edgeButton = event.target.closest("[data-modal-edge-id]");
          if (edgeButton) {
            event.preventDefault();
            navigateModal({ type: "edge", id: edgeButton.getAttribute("data-modal-edge-id") });
          }
        });
        document.getElementById("count-strip").addEventListener("click", (event) => {
          const listButton = event.target.closest("[data-list-kind]");
          if (!listButton) return;
          event.preventDefault();
          navigateModal({ type: "list", kind: listButton.getAttribute("data-list-kind") });
        });
        window.addEventListener("popstate", (event) => {
          if (event.state?.profileModal) {
            navigateModal(event.state.profileModal, { push: false, fromPopState: true, historyIndex: event.state.modalIndex });
          } else if (parseModalEntryFromHash(window.location.hash)) {
            navigateModal(parseModalEntryFromHash(window.location.hash), { push: false, fromPopState: true });
          } else if (!document.getElementById("node-modal").hidden) {
            closeModal({ preserveHistory: true });
          }
        });
      }

      function projectNodes() {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const scale = Math.min(width, height) / 700 * state.zoom;
        const projected = new Map();
        state.filteredNodes.forEach((node) => {
          const point = rotate(node.x, node.y, node.z || 0);
          const perspective = 680 / (680 - point.z);
          projected.set(node.id, {
            node,
            x: width / 2 + point.x * scale * perspective,
            y: height / 2 + point.y * scale * perspective,
            depth: point.z,
            radius: nodeRadius(node) * perspective,
          });
        });
        return projected;
      }

      function rotate(x, y, z) {
        const cosY = Math.cos(state.rotationY);
        const sinY = Math.sin(state.rotationY);
        const cosX = Math.cos(state.rotationX);
        const sinX = Math.sin(state.rotationX);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        return { x: x1, y: y1, z: z2 };
      }

      function drawLinks(projected) {
        const ordered = [...state.filteredLinks].sort((a, b) => {
          const az = ((projected.get(a.from) || {}).depth || 0) + ((projected.get(a.to) || {}).depth || 0);
          const bz = ((projected.get(b.from) || {}).depth || 0) + ((projected.get(b.to) || {}).depth || 0);
          return az - bz;
        });
        ordered.forEach((link) => {
          const a = projected.get(link.from);
          const b = projected.get(link.to);
          if (!a || !b) return;
          const selected = state.selectedEdge && state.selectedEdge.id === link.id;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = selected ? "#101828" : edgeColors[link.type] || "#98a2b3";
          ctx.globalAlpha = selected ? 0.85 : 0.28;
          ctx.lineWidth = selected ? 3 : 1.2;
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      function drawNodes(projected) {
        const ordered = [...projected.values()].sort((a, b) => a.depth - b.depth);
        ordered.forEach((item) => {
          const node = item.node;
          const selected = state.selectedNode && state.selectedNode.id === node.id;
          const hovered = state.hoverNode && state.hoverNode.id === node.id;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius + (selected ? 3 : 0), 0, Math.PI * 2);
          ctx.fillStyle = selected ? "#101828" : colorByKind[node.kind] || "#475467";
          ctx.globalAlpha = 0.74 + clamp(item.depth / 900, -0.25, 0.18);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = hovered || selected ? 2.2 : 1;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
          if (selected || hovered || node.kind === "action") {
            drawLabel(node.title || node.id, item.x, item.y - item.radius - 8, selected);
          }
        });
      }

      function drawLabel(text, x, y, strong) {
        const label = String(text).slice(0, 44);
        ctx.font = `${strong ? 700 : 600} 12px system-ui, sans-serif`;
        const width = Math.min(260, ctx.measureText(label).width + 14);
        ctx.fillStyle = strong ? "rgba(16, 24, 40, 0.92)" : "rgba(255, 255, 255, 0.92)";
        ctx.strokeStyle = "rgba(16, 24, 40, 0.12)";
        roundRect(ctx, x - width / 2, y - 18, width, 20, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = strong ? "#ffffff" : "#17202a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y - 8, width - 10);
      }

      function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
      }

      function updateHover(event) {
        const hit = hitTest(event);
        state.hoverNode = hit && hit.type === "node" ? hit.node : null;
      }

      function selectFromPointer(event) {
        const hit = hitTest(event);
        if (!hit) return;
        if (hit.type === "node") {
          state.selectedNode = hit.node;
          state.selectedEdge = null;
          renderNodeDetails(hit.node);
        } else {
          state.selectedEdge = hit.edge;
          state.selectedNode = null;
          renderEdgeDetails(hit.edge);
        }
        renderMatrix();
        renderExplanation();
      }

      function hitTest(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const projected = projectNodes();
        let closest = null;
        for (const item of projected.values()) {
          const distance = Math.hypot(item.x - x, item.y - y);
          if (distance <= item.radius + 16 && (!closest || distance < closest.distance)) {
            closest = { type: "node", node: item.node, distance };
          }
        }
        if (closest) return closest;
        for (const link of state.filteredLinks) {
          const a = projected.get(link.from);
          const b = projected.get(link.to);
          if (!a || !b) continue;
          const distance = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
          if (distance < 4) return { type: "edge", edge: link };
        }
        return null;
      }

      async function renderNodeDetails(node) {
        syncNodeDetailPanel(node);
        await navigateModal({ type: "node", id: node.id });
      }

      function renderOverview() {
        renderCounts();
        renderLegend();
        renderMatrix();
        renderGaps();
        renderExtensions();
        renderExplanation();
        document.getElementById("graph-root-label").textContent = state.summary.graph_root || "";
        document.getElementById("detail-body").innerHTML = metadataHtml({
          kind: "graph",
          actors: state.summary.counts.actors,
          stories: state.summary.counts.stories,
          actions: state.summary.counts.actions,
          edges: state.summary.counts.edges,
          watch: state.summary.watch,
        });
        document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Select an actor, story, action, role, guide, or edge.</div>';
        document.getElementById("edge-detail").textContent = "No edge selected.";
      }

      function renderCounts() {
        const counts = state.summary.counts || {};
        document.getElementById("count-strip").innerHTML = ["actors", "stories", "actions", "edges"].map((key) => (
          `<button class="metric" type="button" data-list-kind="${escapeAttribute(key)}" aria-label="Show ${escapeAttribute(key)} list"><strong>${escapeHtml(counts[key] ?? 0)}</strong><span>${escapeHtml(key)}</span></button>`
        )).join("");
      }

      function renderLegend() {
        const legend = document.getElementById("graph-legend");
        legend.innerHTML = [
          ["actor", colorByKind.actor],
          ["story", colorByKind.story],
          ["action", colorByKind.action],
          ["role", colorByKind.role],
          ["guide", colorByKind.guide],
        ].map(([label, color]) => `<span class="legend-pill" style="--dot:${color}">${label}</span>`).join("");
      }

      function renderEdgeDetails(edge) {
        syncEdgeDetailPanel(edge);
        navigateModal({ type: "edge", id: edge.id });
      }

      function syncNodeDetailPanel(node) {
        document.getElementById("detail-title").textContent = node.title || node.id;
        document.getElementById("detail-body").innerHTML = metadataHtml(node);
        document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Structured detail is open in the modal.</div>';
        document.getElementById("edge-detail").className = "empty-state";
        document.getElementById("edge-detail").textContent = "No edge selected.";
      }

      function syncEdgeDetailPanel(edge) {
        const storyLookup = normalizeRecords(state.actorGraph.stories);
        const origin = storyLookup[edge.from] || {};
        const handler = storyLookup[edge.to] || {};
        const html = [
          fieldRow("Type", edge.type || "related"),
          fieldRow("Origin", origin.title || edge.from),
          fieldRow("Affected actor", edge.affected_actor || handler.actor_title || "unknown"),
          fieldRow("Handler", handler.title || edge.to),
          fieldRow("Action", prettyAction(edge.action_id || origin.action_id || handler.action_id || "")),
          fieldRow("Coverage", edge.coverage_note || ""),
        ].join("");
        const detail = document.getElementById("edge-detail");
        detail.className = "metadata-grid";
        detail.innerHTML = html;
        document.getElementById("detail-title").textContent = `${edge.type || "related"} edge`;
        document.getElementById("detail-body").innerHTML = metadataHtml({ from: edge.from, to: edge.to, cross_action: edge.cross_action });
        document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Structured edge detail is open in the modal.</div>';
      }

      function syncListDetailPanel(kind) {
        const config = listConfig(kind);
        document.getElementById("detail-title").textContent = config.title;
        document.getElementById("detail-body").innerHTML = metadataHtml({
          primitive: config.primitive,
          items: String(config.rows().length),
          purpose: config.summary,
        });
        document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Structured list is open in the modal.</div>';
        document.getElementById("edge-detail").className = "empty-state";
        document.getElementById("edge-detail").textContent = "No edge selected.";
      }

      function renderMatrix() {
        const actionId = selectedActionId();
        const actors = normalizeRecords(state.actorGraph.actors);
        const stories = normalizeRecords(state.actorGraph.stories);
        const rows = Object.values(actors).sort(byTitle).map((actor) => {
          const actorStories = Object.values(stories).filter((story) => story.actor_id === actor.id && story.action_id === actionId);
          const availability = actorStories.length
            ? sortedUnique(actorStories.map((story) => labelFor(story.availability || "unknown"))).join(", ")
            : "No story for this action";
          return { actor, actorStories, availability };
        });
        document.getElementById("matrix-body").innerHTML = `
          <p class="muted">${escapeHtml(prettyAction(actionId))}</p>
          <table class="matrix">
            <thead><tr><th>Actor</th><th>Roles</th><th>Story outcome</th><th>Stories</th></tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.actor.title || row.actor.id)}</td>
                  <td>${badges(row.actor.roles || [])}</td>
                  <td>${badges(row.availability.split(", ").filter(Boolean))}</td>
                  <td>${escapeHtml(row.actorStories.map((story) => story.title || story.story_key || story.id).join(", ") || "No story covers this actor for the selected action.")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>`;
      }

      function renderGaps() {
        const diagnostics = [...structuredDiagnostics()];
        const actionId = selectedActionId();
        const actors = normalizeRecords(state.actorGraph.actors);
        const stories = normalizeRecords(state.actorGraph.stories);
        const representedRoles = new Set();
        Object.values(stories).filter((story) => story.action_id === actionId).forEach((story) => {
          const actor = actors[story.actor_id];
          (actor?.roles || []).forEach((role) => representedRoles.add(role));
        });
        sortedUnique(Object.values(actors).flatMap((actor) => actor.roles || [])).forEach((role) => {
          if (!representedRoles.has(role)) {
            diagnostics.push({
              severity: "info",
              code: "missing_role_story",
              message: `Missing role story for ${role} on ${prettyAction(actionId)}`,
            });
          }
        });
        state.edges.filter((edge) => edge.type === "conflicts").forEach((edge) => {
          diagnostics.push({
            severity: "warning",
            code: "conflict_edge",
            message: `Conflict edge: ${edge.from} -> ${edge.to}`,
          });
        });
        const body = diagnostics.length
          ? diagnostics.map((item) => `<div class="list-row"><strong>${escapeHtml(item.severity || "info")} ${escapeHtml(item.code || "diagnostic")}</strong>${escapeHtml(item.message || item)}</div>`).join("")
          : '<div class="empty-state">No diagnostics reported by the current graph.</div>';
        document.getElementById("gap-body").innerHTML = body;
      }

      function structuredDiagnostics() {
        const details = state.summary.diagnostics_detail || state.extensions.diagnostics || [];
        if (details.length) return details;
        return (state.summary.diagnostics || []).map((message) => ({ severity: "info", code: "diagnostic", message }));
      }

      function renderExtensions() {
        const pages = state.extensions.pages || [];
        const metadata = state.extensions.metadata || {};
        const links = metadata.links || [];
        const keys = [...(metadata.actor_keys || []), ...(metadata.story_keys || [])];
        const pageHtml = pages.length
          ? pages.map((page) => `
            <button class="list-row" type="button" data-page-path="${escapeAttribute(page.path)}">
              <strong>${escapeHtml(page.status || "page")}</strong>${escapeHtml(page.title || page.id)}
              <p class="muted">${escapeHtml(page.summary || page.path)}</p>
            </button>
          `).join("")
          : '<div class="empty-state">No project pages discovered.</div>';
        const metadataHtml = keys.length
          ? `<div class="list-row"><strong>metadata keys</strong>${escapeHtml(sortedUnique(keys).join(", "))}</div>`
          : "";
        const linkHtml = links.length
          ? `<div class="list-row"><strong>extension links</strong>${escapeHtml(links.map((link) => `${link.type}:${link.target}`).join(", "))}</div>`
          : "";
        const container = document.getElementById("extensions-body");
        container.innerHTML = pageHtml + metadataHtml + linkHtml;
        container.querySelectorAll("[data-page-path]").forEach((button) => {
          button.addEventListener("click", () => renderExtensionPage(button.getAttribute("data-page-path")));
        });
      }

      async function renderExtensionPage(path) {
        if (!path) return;
        const page = (state.extensions.pages || []).find((item) => item.path === path) || { title: path };
        document.getElementById("detail-title").textContent = page.title || path;
        document.getElementById("detail-body").innerHTML = metadataHtml(page.frontmatter || page);
        document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Project page is open in the modal.</div>';
        await navigateModal({ type: "page", path });
      }

      async function openModalFromLocationHash() {
        const entry = parseModalEntryFromHash(window.location.hash);
        if (!entry) return;
        state.modalHistory = [entry];
        state.modalHistoryIndex = 0;
        window.history.replaceState({ profileModal: entry, modalIndex: 0 }, "", window.location.href);
        await renderModalEntry(entry, { focus: false });
        updateModalHistoryControls();
      }

      async function navigateModal(entry, options = {}) {
        const normalized = normalizeModalEntry(entry);
        if (!normalized) return;

        if (options.push !== false) {
          pushModalHistory(normalized);
        } else if (options.fromPopState) {
          syncModalHistoryIndex(normalized, options.historyIndex);
        }

        await renderModalEntry(normalized, options);
        updateModalHistoryControls();
      }

      function pushModalHistory(entry) {
        const current = state.modalHistory[state.modalHistoryIndex];
        if (sameModalEntry(current, entry)) return;
        state.modalHistory = state.modalHistory.slice(0, state.modalHistoryIndex + 1);
        state.modalHistory.push(entry);
        state.modalHistoryIndex = state.modalHistory.length - 1;
        pushBrowserModalState(entry);
      }

      function syncModalHistoryIndex(entry, historyIndex) {
        if (Number.isInteger(historyIndex) && sameModalEntry(state.modalHistory[historyIndex], entry)) {
          state.modalHistoryIndex = historyIndex;
          return;
        }
        const found = state.modalHistory.findIndex((item) => sameModalEntry(item, entry));
        if (found >= 0) {
          state.modalHistoryIndex = found;
          return;
        }
        state.modalHistory.push(entry);
        state.modalHistoryIndex = state.modalHistory.length - 1;
      }

      async function renderModalEntry(entry, options = {}) {
        if (entry.type === "node") {
          const node = state.nodes.find((item) => item.id === entry.id);
          if (!node) return;
          state.selectedNode = node;
          state.selectedEdge = null;
          syncNodeDetailPanel(node);
          await openNodeModal(node, options);
        } else if (entry.type === "edge") {
          const edge = findModalEdge(entry.id);
          if (!edge) return;
          state.selectedNode = null;
          state.selectedEdge = edge;
          syncEdgeDetailPanel(edge);
          openEdgeModal(edge, options);
        } else if (entry.type === "page") {
          const page = (state.extensions.pages || []).find((item) => item.path === entry.path) || { title: entry.path, path: entry.path };
          document.getElementById("detail-title").textContent = page.title || entry.path;
          document.getElementById("detail-body").innerHTML = metadataHtml(page.frontmatter || page);
          document.getElementById("markdown-panel").innerHTML = '<div class="empty-state">Project page is open in the modal.</div>';
          await openDocumentModal(page, entry.path, options);
        } else if (entry.type === "list") {
          state.selectedNode = null;
          state.selectedEdge = null;
          syncListDetailPanel(entry.kind);
          openListModal(entry.kind, options);
        }
        renderMatrix();
        renderExplanation();
      }

      function navigateModalNode(id) {
        const node = state.nodes.find((item) => item.id === id);
        if (node) navigateModal({ type: "node", id: node.id });
      }

      function navigateModalBack() {
        if (state.modalHistoryIndex <= 0) return;
        window.history.back();
      }

      function navigateModalForward() {
        if (state.modalHistoryIndex >= state.modalHistory.length - 1) return;
        window.history.forward();
      }

      function updateModalHistoryControls() {
        const back = document.getElementById("modal-back");
        const forward = document.getElementById("modal-forward");
        back.disabled = state.modalHistoryIndex <= 0;
        forward.disabled = state.modalHistoryIndex < 0 || state.modalHistoryIndex >= state.modalHistory.length - 1;
      }

      function pushBrowserModalState(entry) {
        const url = new URL(window.location.href);
        url.hash = `profile=${encodeURIComponent(JSON.stringify(entry))}`;
        window.history.pushState({ profileModal: entry, modalIndex: state.modalHistoryIndex }, "", url);
      }

      function parseModalEntryFromHash(hash) {
        if (!hash.startsWith("#profile=")) return null;
        try {
          return normalizeModalEntry(JSON.parse(decodeURIComponent(hash.slice("#profile=".length))));
        } catch (error) {
          return null;
        }
      }

      function normalizeModalEntry(entry) {
        if (!entry || typeof entry !== "object") return null;
        if (entry.type === "node" && state.nodes.some((node) => node.id === entry.id)) {
          return { type: "node", id: entry.id };
        }
        if (entry.type === "edge" && findModalEdge(entry.id)) {
          return { type: "edge", id: entry.id };
        }
        if (entry.type === "page" && entry.path) {
          return { type: "page", path: entry.path };
        }
        const listKind = normalizeListKind(entry.kind);
        if (entry.type === "list" && listKind) {
          return { type: "list", kind: listKind };
        }
        return null;
      }

      function findModalEdge(id) {
        return state.links.find((edge) => edge.id === id);
      }

      function sameModalEntry(a, b) {
        return Boolean(a && b && modalEntryKey(a) === modalEntryKey(b));
      }

      function modalEntryKey(entry) {
        return `${entry.type}:${entry.id || entry.path || entry.kind || ""}`;
      }

      async function openNodeModal(node, options = {}) {
        let documentPayload = null;
        if (node.path) {
          try {
            documentPayload = await fetchDocument(node.path);
          } catch (error) {
            documentPayload = { title: node.title || node.id, sections: [], frontmatter: {}, error: error.message };
          }
        }
        const storyIntent = node.kind === "story" ? storyIntentSummary(node, documentPayload) : "";
        const summary = nodeSummaryForModal(node, documentPayload, storyIntent);
        const chips = [
          node.kind,
          node.status,
          node.actor_class,
          node.availability,
          node.priority,
          ...(node.roles || []),
          node.action_id ? prettyAction(node.action_id) : "",
        ].filter(Boolean);
        const facts = modalFactsHtml(nodeFactsRecord(node, documentPayload));
        const relationships = relationshipHtml(node);
        const sections = sectionCardsHtml(documentPayload, { storyIntent });
        const body = `
          <div class="modal-hero">
            <div>
              <p>${escapeHtml(summary)}</p>
            </div>
            <div class="chip-row">${badges(chips)}</div>
          </div>
          <div class="modal-grid">
            <section class="detail-card">
              <h3>${escapeHtml(factsTitle(node))}</h3>
              <div class="modal-facts">${facts}</div>
            </section>
            <section class="detail-card">
              <h3>${escapeHtml(relationshipTitle(node))}</h3>
              ${relationships}
            </section>
          </div>
          ${sections}
        `;
        showModal(labelFor(node.kind), node.title || node.id, body, options);
      }

      function openEdgeModal(edge, options = {}) {
        const stories = normalizeRecords(state.actorGraph.stories);
        const actors = normalizeRecords(state.actorGraph.actors);
        const origin = stories[edge.from] || {};
        const handler = stories[edge.to] || {};
        const affectedActor = actors[edge.affected_actor] || actors[handler.actor_id] || {};
        const body = `
          <div class="modal-hero">
            <div>
              <p>${escapeHtml(edge.coverage_note || "This typed edge records how one actor story creates work, risk, or a handoff that another story must handle.")}</p>
            </div>
            <div class="chip-row">${badges([edge.type || "related", edge.cross_action ? "cross action" : "", prettyAction(edge.action_id || origin.action_id || handler.action_id || "")])}</div>
          </div>
          <div class="modal-grid">
            <section class="detail-card">
              <h3>Edge Facts</h3>
              <div class="modal-facts">${modalFactsHtml({
                type: edge.type || "related",
                origin: origin.title || edge.from,
                handler: handler.title || edge.to,
                affected_actor: affectedActor.title || edge.affected_actor || handler.actor_title,
                action: prettyAction(edge.action_id || origin.action_id || handler.action_id || ""),
                cross_action: edge.cross_action ? "yes" : "no",
              })}</div>
            </section>
            <section class="detail-card">
              <h3>Trace Links</h3>
              <div class="relationship-list">
                ${relationshipButton(origin.id, origin.title || edge.from, "origin story")}
                ${relationshipButton(handler.id, handler.title || edge.to, "handler story")}
                ${affectedActor.id ? relationshipButton(affectedActor.id, affectedActor.title || affectedActor.id, "affected actor") : ""}
              </div>
            </section>
          </div>
        `;
        showModal("Story edge", `${origin.title || edge.from} to ${handler.title || edge.to}`, body, options);
      }

      async function openDocumentModal(page, path, options = {}) {
        const documentPayload = await fetchDocument(path);
        const body = `
          <div class="modal-hero">
            <div>
              <p>${escapeHtml(documentSummary(documentPayload) || page.summary || "Project-owned profile page.")}</p>
            </div>
            <div class="chip-row">${badges([page.status || "page", ...asArray(page.frontmatter?.tags)])}</div>
          </div>
          <div class="modal-grid">
            <section class="detail-card">
              <h3>Page Facts</h3>
              <div class="modal-facts">${modalFactsHtml({ ...(page.frontmatter || {}), path })}</div>
            </section>
            <section class="detail-card">
              <h3>Links</h3>
              ${extensionLinkHtml(page.links || [])}
            </section>
          </div>
          ${sectionCardsHtml(documentPayload)}
        `;
        showModal("Project page", documentPayload.title || page.title || path, body, options);
      }

      function openListModal(kind, options = {}) {
        const config = listConfig(kind);
        const rows = config.rows();
        const body = `
          <div class="modal-hero">
            <div>
              <p>${escapeHtml(config.summary)}</p>
            </div>
            <div class="chip-row">${badges(["list view", `${rows.length} items`, config.primitive])}</div>
          </div>
          ${listTableHtml(config, rows)}
        `;
        showModal("List view", config.title, body, options);
      }

      function listConfig(kind) {
        const actors = normalizeRecords(state.actorGraph.actors);
        const stories = normalizeRecords(state.actorGraph.stories);
        const configs = {
          actors: {
            title: "Actors",
            primitive: "actor",
            summary: "Actors are role-bearing people, fixtures, stakeholders, and adversarial forces. This list shows who exists in the story graph and what work or pressure they bring to the system.",
            headers: ["Actor", "Roles", "Need / job", "Stories"],
            rows: () => state.nodes
              .filter((node) => node.kind === "actor")
              .sort(byTitle)
              .map((actor) => ({
                linkType: "node",
                id: actor.id,
                cells: [
                  actor.title || actor.id,
                  readableList(actor.roles || [], "No role recorded."),
                  firstSentence(actor.role_summary || actor.job_context || actor.personality || "Open this actor to inspect their profile."),
                  `${(actor.story_ids || []).length} stories`,
                ],
              })),
          },
          stories: {
            title: "User Stories",
            primitive: "story",
            summary: "Stories are stable actor flows. Each row names the actor, trigger, capability, outcome, and surface so the scenario can be traced into design, tests, frontend behavior, backend behavior, audit, and code.",
            headers: ["Story", "Actor", "Action / capability", "Trigger", "State / outcome", "Surface"],
            rows: () => state.nodes
              .filter((node) => node.kind === "story")
              .sort(byTitle)
              .map((story) => ({
                linkType: "node",
                id: story.id,
                cells: [
                  story.title || story.id,
                  story.actor_title || story.actor_id,
                  prettyAction(story.action_id),
                  cleanInline(story.trigger || "No trigger recorded."),
                  storyOutcomeSummary(story),
                  cleanInline(story.ui_surfaces || story.route || story.backend_surfaces || "No surface recorded."),
                ],
              })),
          },
          actions: {
            title: "Actions",
            primitive: "action",
            summary: "Actions are authorization-grade business capabilities: the action argument in require_authorization(actor, action, target). Each row summarizes who attempts the capability, what it touches, and what outcomes are covered.",
            headers: ["Action", "Stories", "Actors", "Outcomes", "Targets / scopes"],
            rows: () => state.nodes
              .filter((node) => node.kind === "action")
              .sort(byTitle)
              .map((action) => {
                const actionId = actionIdForNode(action);
                const actionStories = storiesForAction(actionId);
                return {
                  linkType: "node",
                  id: action.id,
                  cells: [
                    prettyAction(actionId),
                    `${actionStories.length} stories`,
                    summarizeList(actorsForStories(actionStories).map((actor) => actor.title || actor.id), "No linked actors yet.", 3),
                    availabilitySummary(actionStories),
                    actionTargetSummary(actionStories),
                  ],
                };
              }),
          },
          edges: {
            title: "Story Edges",
            primitive: "edge",
            summary: "Edges show when one story creates work, risk, conflict, or a handoff for another actor's story. They are the connective tissue that reveals missing handlers and cross-actor consequences.",
            headers: ["Origin story", "Edge", "Handler story", "Affected actor", "Coverage"],
            rows: () => storyEdgeLinks()
              .sort((a, b) => String(edgeStoryTitle(a.from)).localeCompare(edgeStoryTitle(b.from)))
              .map((edge) => ({
                linkType: "edge",
                id: edge.id,
                cells: [
                  edgeStoryTitle(edge.from),
                  labelFor(edge.type || "related"),
                  edgeStoryTitle(edge.to),
                  actors[edge.affected_actor]?.title || edge.affected_actor || stories[edge.to]?.actor_title || "Affected actor not recorded.",
                  edge.coverage_note || "Open this edge to inspect its handler.",
                ],
              })),
          },
        };
        return configs[normalizeListKind(kind)] || configs.actors;
      }

      function listTableHtml(config, rows) {
        if (!rows.length) return '<div class="empty-state">No items found for this list.</div>';
        return `
          <div class="modal-table-wrap">
            <table class="modal-list-table">
              <thead>
                <tr>${config.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${rows.map((row) => `
                  <tr>
                    ${row.cells.map((cell, index) => `<td>${index === 0 ? tableLinkHtml(row, cell) : escapeHtml(cell)}</td>`).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      function tableLinkHtml(row, label) {
        const attribute = row.linkType === "edge" ? "data-modal-edge-id" : "data-modal-node-id";
        return `<button class="table-link" type="button" ${attribute}="${escapeAttribute(row.id)}">${escapeHtml(label)}</button>`;
      }

      function storyEdgeLinks() {
        return state.links.filter((edge) => String(edge.id || "").startsWith("story-edge:"));
      }

      function edgeStoryTitle(storyId) {
        const stories = normalizeRecords(state.actorGraph.stories);
        return stories[storyId]?.title || storyId;
      }

      async function fetchDocument(path) {
        if (!path) return null;
        if (!state.documents[path]) {
          state.documents[path] = await fetchJson(`/api/document?path=${encodeURIComponent(path)}`);
        }
        return state.documents[path];
      }

      function showModal(eyebrow, title, bodyHtml, options = {}) {
        const modal = document.getElementById("node-modal");
        state.modalLastFocus = document.activeElement;
        document.getElementById("modal-eyebrow").textContent = eyebrow || "Detail";
        document.getElementById("modal-title").textContent = title || "Detail";
        document.getElementById("modal-body").innerHTML = bodyHtml || '<div class="empty-state">No detail available.</div>';
        modal.hidden = false;
        updateModalHistoryControls();
        if (options.focus !== false) document.getElementById("modal-close").focus();
      }

      function closeModal(options = {}) {
        const modal = document.getElementById("node-modal");
        modal.hidden = true;
        document.getElementById("modal-body").innerHTML = "";
        if (options.preserveHistory) {
          state.modalHistoryIndex = -1;
          updateModalHistoryControls();
        } else {
          state.modalHistoryIndex = -1;
          const url = new URL(window.location.href);
          url.hash = "";
          window.history.replaceState(null, "", url);
          updateModalHistoryControls();
        }
        if (state.modalLastFocus && typeof state.modalLastFocus.focus === "function") {
          state.modalLastFocus.focus();
        }
      }

      function nodeSummary(node, documentPayload) {
        if (documentPayload?.error) return documentPayload.error;
        return firstNonEmpty([
          documentSectionText(documentPayload, "Intent"),
          documentSectionText(documentPayload, "Personality"),
          documentSectionText(documentPayload, "Job and Life Context"),
          documentSectionText(documentPayload, "Routine"),
          documentSectionText(documentPayload, "Expected Flow"),
          documentSummary(documentPayload),
          node.story_key,
          node.source_profile,
          node.id,
        ]);
      }

      function nodeSummaryForModal(node, documentPayload, storyIntent = "") {
        if (documentPayload?.error) return documentPayload.error;
        if (node.kind === "story") return storyIntent || nodeSummary(node, documentPayload);
        if (node.kind === "action") return actionSummary(node);
        if (node.kind === "role") return roleSummary(node);
        if (node.kind === "actor") return actorSummary(node, documentPayload);
        if (node.kind === "guide") return guideSummary(node);
        return nodeSummary(node, documentPayload);
      }

      function actorSummary(node, documentPayload) {
        const roleSummary = node.role_summary || documentSectionText(documentPayload, "Role");
        const job = firstSentence(node.job_context || documentSectionText(documentPayload, "Job and Life Context"));
        const roles = readableList(node.roles || []);
        return firstNonEmpty([
          `${node.title || node.id} is an actor: ${roleSummary || job || "a role-bearing person, system fixture, stakeholder, or adversarial force in the story graph"}. Their roles are ${roles || "recorded in the profile"}.`,
          nodeSummary(node, documentPayload),
        ]);
      }

      function actionSummary(node) {
        const actionId = actionIdForNode(node);
        const stories = storiesForAction(actionId);
        const actors = actorsForStories(stories);
        const actorPhrase = actors.length ? `${actors.length} actor${actors.length === 1 ? "" : "s"}` : "the linked actors";
        const storyPhrase = stories.length ? `${stories.length} stor${stories.length === 1 ? "y" : "ies"}` : "the linked stories";
        return `The ${prettyAction(actionId)} action is a named business capability, not a button click. It is the action argument in require_authorization(actor, "${actionId}", target), and this graph traces it through ${storyPhrase} across ${actorPhrase}.`;
      }

      function roleSummary(node) {
        const role = roleName(node);
        const actors = actorsForRole(role);
        const stories = storiesForRole(role);
        return `The ${labelFor(role)} role is a permission identity attached to actors. It explains who may attempt related actions, where their scope starts and stops, and which ${stories.length || "linked"} stories prove the role's behavior.`;
      }

      function guideSummary(node) {
        return `${node.title || node.id} is a guiding figure: an optional decision bias or outside force that can shape tradeoffs without being a normal product user.`;
      }

      function nodeFactsRecord(node, documentPayload) {
        if (node.kind === "story") return storyPrimitiveFacts(node, documentPayload);
        if (node.kind === "action") return actionPrimitiveFacts(node);
        if (node.kind === "role") return rolePrimitiveFacts(node);
        if (node.kind === "actor") return actorPrimitiveFacts(node, documentPayload);
        if (node.kind === "guide") return guidePrimitiveFacts(node);
        return { ...(documentPayload?.frontmatter || {}), ...node };
      }

      function actorPrimitiveFacts(node, documentPayload) {
        return {
          primitive: "Actor - a role-bearing person, fixture, stakeholder, or adversarial force.",
          need_or_job: firstNonEmpty([node.role_summary, documentSectionText(documentPayload, "Role"), node.job_context, documentSectionText(documentPayload, "Job and Life Context")]),
          roles: node.roles || [],
          routine: firstNonEmpty([node.routine, documentSectionText(documentPayload, "Routine")]),
          scope_or_boundary: firstNonEmpty([node.security_boundaries, documentSectionText(documentPayload, "Security Boundaries")]),
          test_duty: firstNonEmpty([node.test_duties, documentSectionText(documentPayload, "Test Duties")]),
          growth_dream: firstNonEmpty([node.growth_dream_candidates, documentSectionText(documentPayload, "Growth-Dream Candidates")]),
          seed_fixture: node.seed_anchors,
          source_artifact: node.source_profile || node.path,
        };
      }

      function storyPrimitiveFacts(node, documentPayload) {
        return {
          primitive: "Story - a stable actor flow that can be traced into design, tests, frontend behavior, backend behavior, audit, and code.",
          actor: node.actor_title || node.actor_id,
          trigger: firstNonEmpty([node.trigger, documentSectionText(documentPayload, "Trigger")]),
          action: readableActionReference(node.action_id),
          target_or_scope: storyTargetSummary(node, documentPayload),
          surface: storySurfaceSummary(node, documentPayload),
          state_or_outcome: storyOutcomeSummary(node),
          event_or_evidence: storyEvidenceSummary(node),
          persistence_or_time: firstNonEmpty([node.time_persistence, documentSectionText(documentPayload, "Time and Persistence")]),
          boundary: firstNonEmpty([node.security_boundaries, documentSectionText(documentPayload, "Security Boundaries")]),
          trace_story_key: node.story_key,
          source_artifact: node.source_profile || node.path,
        };
      }

      function actionPrimitiveFacts(node) {
        const actionId = actionIdForNode(node);
        const stories = storiesForAction(actionId);
        const actors = actorsForStories(stories);
        return {
          primitive: "Action - the named business capability an actor attempts against a target.",
          plain_english_capability: prettyAction(actionId),
          authorization_shape: `require_authorization(actor, "${actionId}", target)`,
          actors_who_attempt_it: summarizeList(actors.map((actor) => actor.title || actor.id), "No linked actors yet."),
          story_coverage: `${stories.length} stor${stories.length === 1 ? "y" : "ies"} currently exercise this action.`,
          targets_and_scopes: actionTargetSummary(stories),
          outcomes_covered: availabilitySummary(stories),
          user_surfaces: summarizeStoryField(stories, ["ui_surfaces", "route"], "No user-facing surface is linked yet."),
          backend_or_data_surfaces: summarizeStoryField(stories, ["backend_surfaces"], "No backend/data surface is linked yet."),
          persistence_or_time: summarizeStoryField(stories, ["time_persistence"], "No persistence or schedule rule is linked yet."),
          test_duty: coverageSummary(stories),
          trace_action_id: actionId,
        };
      }

      function rolePrimitiveFacts(node) {
        const role = roleName(node);
        const actors = actorsForRole(role);
        const stories = storiesForRole(role);
        return {
          primitive: "Role - a permission identity attached to one or more actors.",
          permission_identity: labelFor(role),
          actors_with_this_role: summarizeList(actors.map((actor) => actor.title || actor.id), "No actors currently hold this role."),
          actions_attempted: summarizeList(sortedUnique(stories.map((story) => readableActionReference(story.action_id))), "No actions are linked through stories yet."),
          story_coverage: `${stories.length} stor${stories.length === 1 ? "y" : "ies"} currently show this role in action.`,
          targets_and_scopes: actionTargetSummary(stories),
          outcomes_covered: availabilitySummary(stories),
          trace_role_key: role,
        };
      }

      function guidePrimitiveFacts(node) {
        return {
          primitive: "Guiding figure - a decision bias, outside force, or stakeholder principle that can shape product tradeoffs.",
          status: node.status || "suggested",
          decision_bias: node.summary || node.description || node.intent,
          source_artifact: node.source_profile || node.path,
          trace_guide_key: node.id,
        };
      }

      function factsTitle(node) {
        if (node.kind === "story") return "Story Primitives";
        if (node.kind === "action") return "Action Definition";
        if (node.kind === "role") return "Role Definition";
        if (node.kind === "actor") return "Actor Context";
        if (node.kind === "guide") return "Guiding Figure";
        return "Readable Facts";
      }

      function relationshipTitle(node) {
        if (node.kind === "actor") return "Stories This Actor Exercises";
        if (node.kind === "story") return "Linked Actors, Actions, and Handler Stories";
        if (node.kind === "action") return "Stories Exercising This Action";
        if (node.kind === "role") return "Actors With This Role";
        if (node.kind === "guide") return "Influenced Stories";
        return "Connected Records";
      }

      function storyIntentSummary(node, documentPayload) {
        if (documentPayload?.error) return "";
        const actor = node.actor_title || node.actor_id || "this actor";
        const trigger = documentSectionText(documentPayload, "Trigger");
        const expectedFlow = documentSectionText(documentPayload, "Expected Flow");
        const action = node.action_id ? prettyAction(node.action_id) : "";
        const triggerClause = storyTriggerClause(actor, trigger);
        const systemAction = systemActionPhrase(expectedFlow);
        const actorTail = actor && !String(systemAction).toLowerCase().includes(String(actor).toLowerCase())
          ? ` for ${actor}`
          : "";

        if (triggerClause && systemAction) {
          return `When ${triggerClause}, the system should ${systemAction}${actorTail}.`;
        }
        if (systemAction) {
          return `This story defines how the system should ${systemAction}${actorTail}.`;
        }
        if (triggerClause) {
          return `This story captures what ${actor} needs when ${triggerClause}.`;
        }
        if (action) {
          return `This story captures ${actor}'s ${action} path.`;
        }
        return documentSummary(documentPayload);
      }

      function actionIdForNode(node) {
        return node.action_id || String(node.id || "").replace(/^action:/, "");
      }

      function roleName(node) {
        return String(node.id || node.title || "").replace(/^role:/, "");
      }

      function storiesForAction(actionId) {
        return Object.values(normalizeRecords(state.actorGraph.stories))
          .filter((story) => story.action_id === actionId)
          .sort(byTitle);
      }

      function actorsForStories(stories) {
        const actors = normalizeRecords(state.actorGraph.actors);
        return sortedUnique(stories.map((story) => story.actor_id))
          .map((actorId) => actors[actorId])
          .filter(Boolean)
          .sort(byTitle);
      }

      function actorsForRole(role) {
        return Object.values(normalizeRecords(state.actorGraph.actors))
          .filter((actor) => (actor.roles || []).includes(role))
          .sort(byTitle);
      }

      function storiesForRole(role) {
        const actorIds = new Set(actorsForRole(role).map((actor) => actor.id));
        return Object.values(normalizeRecords(state.actorGraph.stories))
          .filter((story) => actorIds.has(story.actor_id))
          .sort(byTitle);
      }

      function storyTargetSummary(node, documentPayload) {
        return firstNonEmpty([
          node.target,
          node.target_scope,
          node.scope,
          documentSectionText(documentPayload, "Target"),
          documentSectionText(documentPayload, "Scope"),
          node.backend_surfaces ? `Data/API resources: ${cleanInline(node.backend_surfaces)}` : "",
          node.route ? `Route scope: ${cleanInline(node.route)}` : "",
          node.ui_surfaces ? `User surface: ${cleanInline(node.ui_surfaces)}` : "",
        ]);
      }

      function storySurfaceSummary(node, documentPayload) {
        return firstNonEmpty([
          node.ui_surfaces,
          documentSectionText(documentPayload, "UI Surfaces"),
          node.route,
          node.backend_surfaces,
          documentSectionText(documentPayload, "Backend/Data Surfaces"),
        ]);
      }

      function storyOutcomeSummary(node) {
        const availability = node.availability ? labelFor(node.availability) : "";
        const expected = cleanInline(node.expected_flow || "");
        if (availability && expected) return `${availability}; expected result: ${expected}`;
        return availability || expected || "";
      }

      function storyEvidenceSummary(node) {
        if (node.coverage) return `${labelFor(node.coverage)} coverage is assigned to this story.`;
        if (node.route) return `Route ${cleanInline(node.route)} can be used as evidence when tested.`;
        return "Use linked tests, screenshots, audit events, or support observations as evidence.";
      }

      function actionTargetSummary(stories) {
        return summarizeStoryField(
          stories,
          ["target", "target_scope", "scope", "backend_surfaces", "route"],
          "No explicit target or scope is linked yet; open the stories to inspect the target implied by their surfaces."
        );
      }

      function summarizeStoryField(stories, keys, fallback) {
        const values = stories.flatMap((story) => keys.map((key) => story[key])).filter(Boolean);
        return summarizeList(values.map(cleanInline), fallback);
      }

      function availabilitySummary(stories) {
        const outcomes = sortedUnique(stories.map((story) => story.availability).filter(Boolean).map(labelFor));
        return summarizeList(outcomes, "No outcomes are linked yet.");
      }

      function coverageSummary(stories) {
        const covered = stories.filter((story) => story.coverage);
        const coverage = sortedUnique(covered.map((story) => labelFor(story.coverage)));
        if (!coverage.length) return "No explicit test coverage is assigned yet; linked stories still define the coverage duty.";
        return `${summarizeList(coverage, "")} coverage across ${covered.length} stor${covered.length === 1 ? "y" : "ies"}.`;
      }

      function readableActionReference(actionId) {
        if (!actionId) return "";
        return `${prettyAction(actionId)} (${actionId})`;
      }

      function storyTriggerClause(actor, trigger) {
        const text = sentenceFragment(trigger);
        if (!text) return "";
        const subjectlessVerbs = new Set([
          "asks",
          "chooses",
          "expects",
          "needs",
          "opens",
          "prefers",
          "requests",
          "searches",
          "tries",
          "uses",
          "wants",
        ]);
        const firstWord = text.split(/\\s+/)[0].toLowerCase();
        if (subjectlessVerbs.has(firstWord)) return `${actor} ${lowerFirst(text)}`;
        return lowerFirst(text);
      }

      function systemActionPhrase(expectedFlow) {
        const text = sentenceFragment(expectedFlow);
        if (!text) return "";
        const firstWord = text.split(/\\s+/)[0].toLowerCase();
        const imperativeStarts = new Set([
          "admit",
          "allow",
          "approve",
          "block",
          "deny",
          "exclude",
          "follow",
          "generate",
          "hide",
          "import",
          "issue",
          "preserve",
          "publish",
          "reconcile",
          "record",
          "require",
          "return",
          "revoke",
          "route",
          "show",
          "surface",
          "update",
          "validate",
        ]);
        if (imperativeStarts.has(firstWord)) return lowerFirst(text);
        return `make sure ${lowerFirst(text)}`;
      }

      function documentSummary(documentPayload) {
        const section = (documentPayload?.sections || []).find((item) => (item.paragraphs || []).length);
        return section ? section.paragraphs[0] : "";
      }

      function documentSectionText(documentPayload, title) {
        const section = (documentPayload?.sections || []).find((item) => item.title === title);
        return firstNonEmpty([...(section?.paragraphs || []), ...(section?.items || [])]);
      }

      function modalFactsHtml(record) {
        const preferred = [
          "primitive",
          "plain_english_capability",
          "authorization_shape",
          "permission_identity",
          "actor",
          "need_or_job",
          "trigger",
          "action",
          "target_or_scope",
          "scope_or_boundary",
          "surface",
          "state_or_outcome",
          "event_or_evidence",
          "actors_who_attempt_it",
          "actors_with_this_role",
          "actions_attempted",
          "story_coverage",
          "targets_and_scopes",
          "outcomes_covered",
          "user_surfaces",
          "backend_or_data_surfaces",
          "persistence_or_time",
          "boundary",
          "roles",
          "routine",
          "test_duty",
          "growth_dream",
          "decision_bias",
          "actor_class",
          "status",
          "availability",
          "priority",
          "route",
          "coverage",
          "action_id",
          "story_key",
          "trace_action_id",
          "trace_story_key",
          "trace_role_key",
          "trace_guide_key",
          "seed_anchors",
          "source_profile",
          "seed_fixture",
          "source_artifact",
          "path",
        ];
        const ordered = [
          ...preferred.filter((key) => Object.prototype.hasOwnProperty.call(record, key)),
          ...Object.keys(record).filter((key) => !preferred.includes(key)),
        ];
        const entries = ordered
          .filter((key) => record[key] !== undefined && record[key] !== null && String(record[key]).length)
          .map((key) => fieldRow(key, formatValue(record[key], key)));
        return entries.join("") || '<div><strong>facts</strong>No queryable fields.</div>';
      }

      function relationshipHtml(node) {
        const actors = normalizeRecords(state.actorGraph.actors);
        const stories = normalizeRecords(state.actorGraph.stories);
        let rows = [];
        if (node.kind === "actor") {
          rows = Object.values(stories)
            .filter((story) => story.actor_id === node.id)
            .sort(byTitle)
            .map((story) => relationshipButton(story.id, story.title || story.id, `${prettyAction(story.action_id)} - ${story.availability || "unknown"}`));
        } else if (node.kind === "story") {
          const actor = actors[node.actor_id] || {};
          rows = [
            relationshipButton(actor.id, actor.title || node.actor_title || node.actor_id, "actor"),
            relationshipButton(`action:${node.action_id}`, prettyAction(node.action_id), "action cluster"),
            ...state.edges
              .filter((edge) => edge.from === node.id || edge.to === node.id)
              .map((edge) => {
                const otherId = edge.from === node.id ? edge.to : edge.from;
                const otherStory = stories[otherId] || {};
                return relationshipButton(otherId, otherStory.title || otherId, edge.type || "story edge");
              }),
          ];
        } else if (node.kind === "action") {
          rows = Object.values(stories)
            .filter((story) => story.action_id === node.action_id)
            .sort(byTitle)
            .map((story) => relationshipButton(story.id, story.title || story.id, story.actor_title || story.actor_id));
        } else if (node.kind === "role") {
          const role = node.id.replace(/^role:/, "");
          rows = Object.values(actors)
            .filter((actor) => (actor.roles || []).includes(role))
            .sort(byTitle)
            .map((actor) => relationshipButton(actor.id, actor.title || actor.id, (actor.roles || []).join(", ")));
        }
        const html = rows.filter(Boolean).slice(0, 18).join("");
        return html ? `<div class="relationship-list">${html}</div>` : '<div class="empty-state">No adjacent records for this selection.</div>';
      }

      function relationshipButton(id, title, meta) {
        if (!id) return "";
        return `
          <button class="relationship-item" type="button" data-modal-node-id="${escapeAttribute(id)}">
            <strong>${escapeHtml(title || id)}</strong>
            <span>${escapeHtml(meta || id)}</span>
          </button>
        `;
      }

      function sectionCardsHtml(documentPayload, options = {}) {
        const sections = (documentPayload?.sections || [])
          .map((section) => modalSection(section, options))
          .filter((section) => {
            const hasBody = (section.paragraphs || []).length || (section.items || []).length || (section.code_blocks || []).length;
            return hasBody && section.title !== documentPayload.title;
          })
          .slice(0, 12);
        if (!sections.length) return '<div class="empty-state">No structured document sections available.</div>';
        return `<div class="section-stack">${sections.map(sectionCardHtml).join("")}</div>`;
      }

      function modalSection(section, options = {}) {
        const next = { ...section };
        const paragraphs = [...(next.paragraphs || [])];
        const firstParagraph = paragraphs[0] || "";
        if (options.storyIntent && next.title === "Intent" && isTraceOnlyIntent(firstParagraph)) {
          next.paragraphs = [options.storyIntent];
        }
        return next;
      }

      function isTraceOnlyIntent(value) {
        return /this story captures\\s+`?story\\//i.test(String(value || ""));
      }

      function sectionCardHtml(section) {
        const paragraphs = (section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("");
        const items = (section.items || []).length
          ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : "";
        const code = (section.code_blocks || []).length
          ? `<pre><code>${escapeHtml(section.code_blocks.join("\\n"))}</code></pre>`
          : "";
        return `<section class="section-card"><h3>${escapeHtml(section.title || "Section")}</h3>${paragraphs}${items}${code}</section>`;
      }

      function extensionLinkHtml(links) {
        if (!links.length) return '<div class="empty-state">No extension links.</div>';
        return `<div class="relationship-list">${links.map((link) => `
          <div class="relationship-item">
            <strong>${escapeHtml(link.type || "link")}</strong>
            <span>${escapeHtml(link.target || "")}</span>
          </div>
        `).join("")}</div>`;
      }

      function renderExplanation() {
        const actionId = selectedActionId();
        const selected = state.selectedNode;
        const edge = state.selectedEdge;
        if (edge) {
          const stories = normalizeRecords(state.actorGraph.stories);
          const actors = normalizeRecords(state.actorGraph.actors);
          const origin = stories[edge.from] || {};
          const handler = stories[edge.to] || {};
          const affected = actors[edge.affected_actor] || {};
          document.getElementById("explanation-body").textContent = `${origin.title || edge.from} creates a ${labelFor(edge.type || "related")} edge for ${affected.title || edge.affected_actor || "another actor"}; ${handler.title || edge.to} handles the receiving story.`;
          return;
        }
        if (selected) {
          const detail = selected.kind === "action"
            ? actionSummary(selected)
            : `${selected.title || selected.id} is shown with adjacent roles, actions, stories, and handoffs so the human reader can trace its part of ${prettyAction(actionId)}.`;
          document.getElementById("explanation-body").textContent = detail;
          return;
        }
        document.getElementById("explanation-body").textContent = `The graph connects actors to roles, stories, action clusters, typed story handoffs, and suggested guiding figures. The current matrix is scoped to ${prettyAction(actionId)}.`;
      }

      function selectedActionId() {
        const selected = state.selectedNode;
        if (selected?.kind === "action") return selected.action_id;
        if (selected?.kind === "story") return selected.action_id;
        const filterValue = valueOf("action-filter");
        if (filterValue !== "all") return filterValue;
        return Object.keys(state.index.actions || {}).sort()[0] || "";
      }

      function metadataHtml(node) {
        const entries = Object.entries(node)
          .filter(([key, value]) => value !== undefined && value !== null && !["x", "y", "z", "action"].includes(key))
          .slice(0, 18);
        if (!entries.length) return '<div class="empty-state">No metadata.</div>';
        return entries.map(([key, value]) => fieldRow(key, formatValue(value, key))).join("");
      }

      function fieldRow(key, value) {
        return `<div><strong>${escapeHtml(fieldLabel(key))}</strong>${escapeHtml(String(value || ""))}</div>`;
      }

      function fieldLabel(key) {
        const labels = {
          action: "Action / capability",
          action_id: "Action / capability",
          actor: "Actor",
          actor_class: "Actor type",
          affected_actor: "Affected actor",
          actors_who_attempt_it: "Actors who attempt it",
          actors_with_this_role: "Actors with this role",
          actions_attempted: "Actions attempted",
          authorization_shape: "Authorization shape",
          availability: "Outcome availability",
          backend_or_data_surfaces: "Backend/data surfaces",
          boundary: "Boundary that must not be crossed",
          coverage: "Test coverage",
          cross_action: "Crosses action boundary",
          decision_bias: "Decision bias",
          event_or_evidence: "Event or evidence",
          growth_dream: "Growth dream",
          handler: "Handler story",
          id: "Trace key",
          kind: "Primitive type",
          need_or_job: "Need / job",
          outcomes_covered: "Outcomes covered",
          origin: "Origin story",
          persistence_or_time: "Persistence / time",
          permission_identity: "Permission identity",
          plain_english_capability: "Plain-English capability",
          primitive: "Primitive",
          priority: "Priority",
          roles: "Roles",
          routine: "Routine",
          route: "Route",
          scope_or_boundary: "Scope / boundary",
          seed_anchors: "Seed fixtures",
          seed_fixture: "Seed fixtures",
          source_artifact: "Source artifact",
          source_profile: "Source profile",
          state_or_outcome: "State / outcome",
          status: "Status",
          story_coverage: "Story coverage",
          story_key: "Trace story key",
          surface: "Surface",
          target_or_scope: "Target / scope",
          targets_and_scopes: "Targets and scopes",
          test_duty: "Test duty",
          trace_action_id: "Trace action key",
          trace_guide_key: "Trace guiding-figure key",
          trace_role_key: "Trace role key",
          trace_story_key: "Trace story key",
          trigger: "Trigger",
          type: "Edge type",
          user_surfaces: "User surfaces",
        };
        return labels[key] || key.replaceAll("_", " ");
      }

      function formatValue(value, key = "") {
        if (Array.isArray(value)) return readableList(value.map((item) => formatValue(item)));
        if ((key === "action_id" || key === "action") && typeof value === "string" && value.startsWith("action-")) return readableActionReference(value);
        if (value && typeof value === "object") return JSON.stringify(value);
        return cleanInline(value);
      }

      function firstNonEmpty(values) {
        return values.find((value) => String(value || "").trim()) || "";
      }

      function firstSentence(value) {
        const text = cleanInline(value);
        const match = text.match(/^(.+?[.!?])\\s/);
        return match ? match[1] : text;
      }

      function readableList(values, fallback = "") {
        const list = sortedUnique(values.map(cleanInline).filter(Boolean));
        if (!list.length) return fallback;
        if (list.length === 1) return list[0];
        if (list.length === 2) return `${list[0]} and ${list[1]}`;
        return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
      }

      function summarizeList(values, fallback = "", max = 5) {
        const list = sortedUnique(values.map(cleanInline).filter(Boolean));
        if (!list.length) return fallback;
        const visible = list.slice(0, max);
        const extra = list.length > max ? `, plus ${list.length - max} more` : "";
        return `${visible.join("; ")}${extra}`;
      }

      function cleanInline(value) {
        return String(value || "").replaceAll("`", "").replace(/\\s+/g, " ").trim();
      }

      function sentenceFragment(value) {
        return cleanInline(value).replace(/[.]+$/u, "");
      }

      function lowerFirst(value) {
        const text = String(value || "").trim();
        return text ? text[0].toLowerCase() + text.slice(1) : "";
      }

      function asArray(value) {
        if (Array.isArray(value)) return value;
        return value ? [value] : [];
      }

      function markdownToHtml(markdown) {
        const lines = String(markdown).split("\\n");
        const htmlLines = [];
        let inPre = false;
        for (const line of lines) {
          if (line.startsWith("```")) {
            htmlLines.push(inPre ? "</code></pre>" : "<pre><code>");
            inPre = !inPre;
          } else if (inPre) {
            htmlLines.push(escapeHtml(line));
          } else if (line.startsWith("#")) {
            const level = Math.min(4, line.match(/^#+/)[0].length);
            htmlLines.push(`<h${level}>${escapeHtml(line.replace(/^#+\\s*/, ""))}</h${level}>`);
          } else if (line.startsWith("- ")) {
            htmlLines.push(`<p>&bull; ${escapeHtml(line.slice(2))}</p>`);
          } else if (line.trim()) {
            htmlLines.push(`<p>${escapeHtml(line)}</p>`);
          }
        }
        return htmlLines.join("");
      }

      function badges(values) {
        const list = Array.isArray(values) ? values : [values];
        return list.map(badgeLabel)
          .filter(Boolean)
          .map((label) => `<span class="badge ${escapeAttribute(label)}">${escapeHtml(label)}</span>`)
          .join("");
      }

      function badgeLabel(value) {
        const text = String(value || "").trim();
        if (!text) return "";
        if (/^p\\d+$/i.test(text)) return `priority ${text.toUpperCase()}`;
        return labelFor(text);
      }

      function normalizeRecords(records) {
        if (Array.isArray(records)) {
          return Object.fromEntries(records.filter((item) => item && item.id).map((item) => [item.id, item]));
        }
        if (records && typeof records === "object") return records;
        return {};
      }

      function normalizeListKind(kind) {
        const allowed = new Set(["actors", "stories", "actions", "edges"]);
        return allowed.has(kind) ? kind : null;
      }

      function valueOf(id) {
        return document.getElementById(id)?.value || "all";
      }

      function searchBlob(node) {
        return [
          node.id,
          node.title,
          node.actor_class,
          node.story_key,
          node.action_id,
          node.availability,
          ...(node.roles || []),
        ].filter(Boolean).join(" ").toLowerCase();
      }

      function prettyAction(actionId) {
        return String(actionId || "all actions").replace(/^action-/, "").replaceAll("-", " ");
      }

      function labelFor(value) {
        return value === "all" ? "All" : prettyAction(value).replaceAll("_", " ");
      }

      function sortedUnique(values) {
        return [...new Set(values.filter(Boolean).map(String))].sort();
      }

      function byTitle(a, b) {
        return String(a.title || a.id).localeCompare(String(b.title || b.id));
      }

      function ringX(index, count, radius) {
        return Math.cos((index / Math.max(count, 1)) * Math.PI * 2) * radius;
      }

      function ringY(index, count, radius) {
        return Math.sin((index / Math.max(count, 1)) * Math.PI * 2) * radius;
      }

      function classDepth(actorClass) {
        const depths = {
          direct_user: -70,
          edge_case_user: -20,
          negative_control_user: 20,
          fixture_actor: 40,
          stakeholder: 95,
          antagonist: 130,
        };
        return depths[actorClass] ?? 0;
      }

      function nodeRadius(node) {
        if (node.kind === "action") return 13;
        if (node.kind === "actor") return 11;
        if (node.kind === "guide") return 10;
        if (node.kind === "role") return 8;
        return 6;
      }

      function distanceToSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax;
        const dy = by - ay;
        if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
        const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function escapeAttribute(value) {
        return escapeHtml(value).replaceAll(" ", "-");
      }

      function openNodeById(id) {
        const node = state.nodes.find((item) => item.id === id);
        if (!node) return false;
        renderNodeDetails(node);
        return true;
      }

      function openModalEntry(entry) {
        navigateModal(entry);
      }

      return { init, openModalEntry, openNodeById, state };
    })();

    document.addEventListener("DOMContentLoaded", () => {
      window.ProfileGraphExplorer.init().catch((error) => {
        document.getElementById("gap-body").innerHTML = `<div class="list-row">${String(error.message || error)}</div>`;
      });
    });
  </script>
</body>
</html>
"""
