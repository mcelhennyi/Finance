#!/usr/bin/env python3
"""Smoke-test `./develop profiles` lifecycle commands.

The test intentionally drives the public wrapper instead of importing the Bash
functions, because T-FR-0004-07 is about the skeleton command contract.

Design: docs/design/profile-server-app.md
Traceability: T-FR-0004-07
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
from urllib.request import urlopen


REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    """Run down/up/status/restart/logs/down against a temporary state dir."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--require-graph", action="store_true", help="Require non-empty actor/story graph counts.")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    host = "127.0.0.1"
    port = free_port(host)
    scratch_root = repo_root / ".tmp"
    scratch_root.mkdir(exist_ok=True)
    state_dir = Path(tempfile.mkdtemp(prefix="profile-server-smoke-", dir=scratch_root))
    env = os.environ.copy()
    env.update(
        {
            "PROFILE_SERVER_HOST": host,
            "PROFILE_SERVER_PORT": str(port),
            "PROFILE_SERVER_STATE_DIR": str(state_dir),
            "PROFILE_GRAPH_ROOT": str(repo_root / "docs" / "design" / "actors"),
        }
    )

    try:
        run_develop(repo_root, env, ["profiles", "down"], check=False)
        up = run_develop(repo_root, env, ["profiles", "up"])
        require("Profile server URL:" in up.stdout, "up did not report local URL")
        require("Profile graph root:" in up.stdout, "up did not report graph root")

        second_up = run_develop(repo_root, env, ["profiles", "up"])
        require("already running" in second_up.stdout, "second up should be idempotent")

        health = wait_json(f"http://{host}:{port}/health")
        require(health["status"] == "ok", "health endpoint did not return ok")
        summary = wait_json(f"http://{host}:{port}/api/summary")
        require(summary["graph_root"] == env["PROFILE_GRAPH_ROOT"], "summary graph root mismatch")
        if args.require_graph:
            require(summary["counts"]["actors"] > 0, "expected derived project actors to be served")
            require(summary["counts"]["stories"] > 0, "expected derived project stories to be served")

        status = run_develop(repo_root, env, ["profiles", "status"])
        require("is running" in status.stdout, "status did not report running server")

        restart = run_develop(repo_root, env, ["profiles", "restart"])
        require("started" in restart.stdout, "restart did not start server")
        restarted_health = wait_json(f"http://{host}:{port}/health")
        require(restarted_health["status"] == "ok", "health failed after restart")

        logs = run_develop(repo_root, env, ["profiles", "logs", "120"])
        require("Profile server listening" in logs.stdout, "logs did not include server startup")

        down = run_develop(repo_root, env, ["profiles", "down"])
        require("stopped" in down.stdout, "down did not stop server")
        stopped = run_develop(repo_root, env, ["profiles", "status"])
        require("is stopped" in stopped.stdout, "status did not report stopped server")

        print(
            "Profile server lifecycle OK: "
            f"down/up/status/restart/logs/down on http://{host}:{port}/"
        )
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
    """Run `./develop` with captured output and helpful assertion failures."""
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
    deadline = time.monotonic() + timeout_seconds
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=1.0) as response:  # noqa: S310 - local smoke test URL
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # pragma: no cover - the assertion reports the final error.
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
        print(f"Profile server lifecycle smoke failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
