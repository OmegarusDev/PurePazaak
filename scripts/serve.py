#!/usr/bin/env python3
"""Persistent local server for Pure Pazaak.

Run this in a Cursor/VS Code task or a terminal you leave open — not an
agent background shell (those get killed with the chat).

    python3 scripts/serve.py
    python3 scripts/serve.py --open
    python3 scripts/serve.py --daemon --open

Rebuilds on src/ changes. Sends Cache-Control: no-store so a browser
refresh always picks up the new bundle.
"""
import argparse
import http.server
import os
import socket
import sys
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

HOST = "127.0.0.1"
PORT = 8765
URL = f"http://{HOST}:{PORT}/"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))


def src_stamp():
    latest = 0
    src = ROOT / "src"
    for dirpath, _, files in os.walk(src):
        for name in files:
            if name.startswith("."):
                continue
            latest = max(latest, os.path.getmtime(os.path.join(dirpath, name)))
    return latest


def rebuild():
    try:
        build.main()
        return True
    except SystemExit as e:
        print("build failed:", e, file=sys.stderr)
        return False
    except Exception as e:
        print("build failed:", e, file=sys.stderr)
        return False


def watch():
    last = src_stamp()
    while True:
        time.sleep(0.6)
        now = src_stamp()
        if now > last:
            last = now
            print("src changed — rebuilding")
            rebuild()


def port_open():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((HOST, PORT)) == 0


LOG = Path("/tmp/pazaak-serve.log")
PIDFILE = Path("/tmp/pazaak-serve.pid")


def daemonize():
    """Detach so the server survives agent-shell teardown."""
    if os.fork() > 0:
        for _ in range(30):
            time.sleep(0.1)
            if port_open():
                return False
        return False
    os.setsid()
    if os.fork() > 0:
        os._exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    log = open(LOG, "a", buffering=1)
    os.dup2(log.fileno(), 1)
    os.dup2(log.fileno(), 2)
    PIDFILE.write_text(str(os.getpid()))
    return True


def serve():
    threading.Thread(target=watch, daemon=True).start()
    httpd = http.server.ThreadingHTTPServer((HOST, PORT), NoCacheHandler)
    print(f"Serving Pure Pazaak at {URL}")
    print("Keep this process running. Edit src/ — then refresh the browser.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--open", action="store_true", help="open the game in your default browser")
    ap.add_argument(
        "--daemon",
        action="store_true",
        help="detach from the terminal (survives Cursor agent sessions)",
    )
    args = ap.parse_args()
    os.chdir(ROOT)
    rebuild()
    if port_open():
        print(f"Already serving Pure Pazaak at {URL}")
        print("Leave that process running and refresh the tab after edits.")
        if args.open:
            webbrowser.open(URL)
        return
    if args.daemon:
        child = daemonize()
        if not child:
            if port_open():
                print(f"Serving Pure Pazaak at {URL} (daemon, log {LOG})")
                if args.open:
                    webbrowser.open(URL)
                return
            print(f"daemon failed to bind; see {LOG}", file=sys.stderr)
            sys.exit(1)
    elif args.open:
        threading.Timer(0.4, lambda: webbrowser.open(URL)).start()
    serve()


if __name__ == "__main__":
    main()
