#!/usr/bin/env python3
"""
NetMine AI - Phase 0: Environment Validation Script
====================================================
Run this script to verify your development environment.

Usage:
    python scripts/check_environment.py
"""

import sys
import os
import shutil
import subprocess
import importlib.util
from pathlib import Path

# Colors
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

PASS = f"{GREEN}[PASS]{RESET}"
FAIL = f"{RED}[FAIL]{RESET}"
WARN = f"{YELLOW}[WARN]{RESET}"
INFO = f"{CYAN}[INFO]{RESET}"

failures = []
warnings = []

IS_WINDOWS = sys.platform == "win32"


def run_cmd(cmd: list[str]) -> tuple[int, str, str]:
    """Run a command cross-platform, using shell on Windows for .CMD/.BAT."""
    use_shell = IS_WINDOWS
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, shell=use_shell,
            timeout=10
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return -1, "", str(e)


def section(title: str):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")


def check(label: str, condition: bool, msg_pass: str = "", msg_fail: str = "", warn: bool = False):
    if condition:
        print(f"  {PASS}  {label}  {GREEN}{msg_pass}{RESET}")
    else:
        tag = WARN if warn else FAIL
        print(f"  {tag}  {label}  {RED}{msg_fail}{RESET}")
        if warn:
            warnings.append(label)
        else:
            failures.append(label)


# ----------------------------------------------------------------
# 1. Python
# ----------------------------------------------------------------
section("1. Python Runtime")
py_version = sys.version_info
check(
    f"Python version: {sys.version.split()[0]}",
    py_version >= (3, 9),
    "OK - Python 3.9+ required",
    f"Python 3.9+ required. You have {py_version.major}.{py_version.minor}"
)
check("pip available", shutil.which("pip") is not None, "pip found", "pip not found")

# ----------------------------------------------------------------
# 2. Node.js / npm
# ----------------------------------------------------------------
section("2. Node.js / npm")
node_path = shutil.which("node")
check("Node.js", node_path is not None,
      f"Found at {node_path}", "Node.js not found - install from nodejs.org")

npm_path = shutil.which("npm")
if not npm_path:
    npm_path = shutil.which("npm.cmd")
check("npm", npm_path is not None, f"Found at {npm_path}", "npm not found")

if node_path:
    code, out, _ = run_cmd(["node", "--version"])
    ver = out
    major = int(ver.lstrip("v").split(".")[0]) if ver.startswith("v") else 0
    check(f"Node.js version: {ver}", major >= 18, "OK - Node 18+ required", f"Node 18+ required, got {ver}")

if npm_path:
    code, out, _ = run_cmd(["npm", "--version"])
    print(f"  {INFO}  npm version: {out}")

# ----------------------------------------------------------------
# 3. Git
# ----------------------------------------------------------------
section("3. Git")
git_path = shutil.which("git")
check("Git", git_path is not None, f"Found at {git_path}", "Git not found - install from git-scm.com")

if git_path:
    code, out, _ = run_cmd(["git", "--version"])
    print(f"  {INFO}  {out}")
    code2, out2, _ = run_cmd(["git", "rev-parse", "--is-inside-work-tree"])
    check("Inside Git repository", code2 == 0, "Git repo detected", "Not inside a Git repository")

# ----------------------------------------------------------------
# 4. TShark / Wireshark
# ----------------------------------------------------------------
section("4. TShark / Wireshark")
tshark_path = shutil.which("tshark")
check("TShark", tshark_path is not None,
      f"Found at {tshark_path}",
      "TShark not found - ensure Wireshark installed and TShark is in PATH",
      warn=True)

if tshark_path:
    code, out, _ = run_cmd(["tshark", "--version"])
    lines = out.splitlines()
    print(f"  {INFO}  {lines[0] if lines else 'unknown'}")

wireshark_path = shutil.which("wireshark")
check("Wireshark", wireshark_path is not None,
      f"Found at {wireshark_path}",
      "Wireshark not found in PATH (needed for GUI captures)",
      warn=True)

# ----------------------------------------------------------------
# 5. Npcap
# ----------------------------------------------------------------
section("5. Npcap (Windows Packet Capture Driver)")
if IS_WINDOWS:
    npcap_paths = [
        Path("C:/Windows/System32/Npcap"),
        Path("C:/Windows/SysWOW64/Npcap"),
        Path("C:/Program Files/Npcap"),
    ]
    found_npcap = any(p.exists() for p in npcap_paths)
    check("Npcap installation", found_npcap,
          "Npcap directory found",
          "Npcap not found - download from https://npcap.com",
          warn=True)
    npcap_dll = Path("C:/Windows/System32/Npcap/wpcap.dll")
    check("Npcap wpcap.dll", npcap_dll.exists(),
          "wpcap.dll found",
          "wpcap.dll missing - reinstall Npcap with WinPcap API compat mode",
          warn=True)
else:
    print(f"  {INFO}  Not Windows - Npcap check skipped")

# ----------------------------------------------------------------
# 6. Python packages
# ----------------------------------------------------------------
section("6. Python Packages")

REQUIRED_PACKAGES = {
    "pandas":     ("Data manipulation", False),
    "numpy":      ("Numerical computing", False),
    "sklearn":    ("Scikit-learn ML", False),
    "xgboost":    ("Gradient boosting", False),
    "joblib":     ("Model serialization", False),
    "mlxtend":    ("Association rule mining", True),
    "fastapi":    ("API framework", False),
    "uvicorn":    ("ASGI server", False),
    "pydantic":   ("Data validation", False),
    "sqlalchemy": ("Database ORM", False),
    "pyshark":    ("Packet parsing", True),
    "scapy":      ("Packet crafting", True),
}

for pkg, (desc, optional) in REQUIRED_PACKAGES.items():
    spec = importlib.util.find_spec(pkg)
    note = " (optional for now)" if optional else " (REQUIRED)"
    check(
        f"{pkg:<15} ({desc})",
        spec is not None,
        "installed",
        f"NOT installed - run: pip install {pkg}{note}",
        warn=optional
    )

# ----------------------------------------------------------------
# 7. Project folder structure
# ----------------------------------------------------------------
section("7. Project Folder Structure")
root = Path(__file__).parent.parent
REQUIRED_DIRS = [
    "data/raw/CICIDS2017",
    "data/raw/UNSW-NB15",
    "data/processed",
    "data/sample",
    "data/metadata",
    "models",
    "notebooks",
    "scripts",
    "ml",
    "data_mining",
    "packet_capture",
    "backend",
    "frontend",
    "docs",
    "tests",
]
for d in REQUIRED_DIRS:
    path = root / d
    check(f"Directory: {d}", path.exists(), "exists", f"MISSING - mkdir {d}")

# ----------------------------------------------------------------
# 8. CICIDS2017 dataset
# ----------------------------------------------------------------
section("8. CICIDS2017 Dataset")

CICIDS_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDoS.pcap_ISCX.csv",
]

cicids_dir = root / "data" / "raw" / "CICIDS2017"
found_count = 0

for fname in CICIDS_FILES:
    fpath = cicids_dir / fname
    if fpath.exists():
        size_mb = fpath.stat().st_size / (1024 * 1024)
        print(f"  {PASS}  {fname}  {GREEN}({size_mb:.1f} MB){RESET}")
        found_count += 1
    else:
        print(f"  {WARN}  {fname}  {YELLOW}NOT FOUND - place in data/raw/CICIDS2017/{RESET}")
        warnings.append(f"CICIDS2017/{fname}")

total = len(CICIDS_FILES)
if found_count == total:
    print(f"\n  {PASS}  All {total} CICIDS2017 files present.")
elif found_count == 0:
    print(f"\n  {WARN}  No CICIDS2017 files found. Place them in data/raw/CICIDS2017/")
else:
    print(f"\n  {WARN}  Found {found_count}/{total} CICIDS2017 files.")

# ----------------------------------------------------------------
# 9. Frontend
# ----------------------------------------------------------------
section("9. Frontend (Phase 1 check)")
frontend_dir = root / "frontend"
check("frontend/ directory", frontend_dir.exists(), "exists", "MISSING - will be created in Phase 1")
package_json = frontend_dir / "package.json"
check("frontend/package.json", package_json.exists(), "exists",
      "NOT found - run Phase 1 setup", warn=True)
node_modules = frontend_dir / "node_modules"
check("frontend/node_modules", node_modules.exists(), "exists",
      "NOT found - cd frontend && npm install", warn=True)

# ----------------------------------------------------------------
# Summary
# ----------------------------------------------------------------
section("SUMMARY")
if failures:
    print(f"\n  {RED}{BOLD}CRITICAL FAILURES ({len(failures)}) - must fix:{RESET}")
    for f in failures:
        print(f"    {RED}x  {f}{RESET}")

if warnings:
    print(f"\n  {YELLOW}{BOLD}WARNINGS ({len(warnings)}) - fix before later phases:{RESET}")
    for w in warnings:
        print(f"    {YELLOW}!  {w}{RESET}")

if not failures and not warnings:
    print(f"\n  {GREEN}{BOLD}All checks passed! Environment is ready.{RESET}")
elif not failures:
    print(f"\n  {YELLOW}{BOLD}Environment partially ready. Fix warnings for full functionality.{RESET}")
else:
    print(f"\n  {RED}{BOLD}Critical issues found. Fix failures before proceeding.{RESET}")
    sys.exit(1)

print()
