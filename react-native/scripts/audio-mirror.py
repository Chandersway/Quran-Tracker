#!/usr/bin/env python3
"""Resumable MP3Quran source mirror; local files and manifest stay untracked."""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import shutil
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANDROID_ASSETS = ROOT / "app" / "src" / "main" / "assets"
DEFAULT_CACHE = ROOT / "react-native" / "audio-cache"
HEADERS = {"User-Agent": "WirdnaAudioMirror/1.0 (Quran audio attribution preserved)"}


def catalog(reciter_id: int) -> tuple[dict, list[dict]]:
    entries = []
    reciter = None
    for surah in range(1, 115):
        path = ANDROID_ASSETS / f"audio_surah_{surah}.json"
        with path.open(encoding="utf-8-sig") as f:
            choices = json.load(f)
        match = next((row for row in choices if int(row["id"]) == reciter_id), None)
        if match is None:
            raise ValueError(f"Reciter id {reciter_id} absent from surah {surah} catalog")
        identity = {"id": reciter_id, "name": match["reciter"]["en"], "name_ar": match["reciter"].get("ar", ""),
                    "riwaya": match["rewaya"]["en"], "source": "MP3Quran.net", "source_url": "https://www.mp3quran.net/eng/privacy",
                    "permission_note": "MP3Quran.net states that visitors and developers may copy its material and use its URLs.",
                    "attribution": f"Recitation by {match['reciter']['en']}. Audio source: MP3Quran.net."}
        if reciter is not None and reciter != identity:
            raise ValueError(f"Reciter metadata changes in catalog at surah {surah}")
        reciter = identity
        entries.append({"surah": surah, "url": match["link"], "source_url": match["link"],
                        "file": f"{reciter_id}/{surah:03}.mp3", "status": "pending", "bytes": None})
    return reciter or {}, entries


def request(url: str, method: str = "HEAD"):
    req = urllib.request.Request(url, headers=HEADERS, method=method)
    return urllib.request.urlopen(req, timeout=45)


def inspect(entry: dict) -> dict:
    for attempt in range(4):
        try:
            with request(entry["url"], "HEAD") as response:
                entry["status"] = "available" if response.status == 200 else f"http_{response.status}"
                entry["bytes"] = int(response.headers.get("Content-Length", 0)) or None
                entry["content_type"] = response.headers.get("Content-Type", "")
                return entry
        except urllib.error.HTTPError as exc:
            entry["status"] = f"http_{exc.code}"
            return entry
        except Exception as exc:
            if attempt == 3:
                entry["status"] = "head_error"
                entry["error"] = type(exc).__name__
                return entry
            time.sleep(1.5 * (attempt + 1))
    return entry


def download(entry: dict, root: Path) -> dict:
    target = root / entry["file"]
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 0:
        if entry.get("bytes") is None or target.stat().st_size == entry["bytes"]:
            entry["status"] = "downloaded"
            entry["downloaded_bytes"] = target.stat().st_size
            return entry
        target.unlink()
    partial = target.with_suffix(target.suffix + ".part")
    for attempt in range(4):
        try:
            with request(entry["url"], "GET") as response, partial.open("wb") as out:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}")
                shutil.copyfileobj(response, out, length=1024 * 1024)
            length = partial.stat().st_size
            if length < 1024 or (entry.get("bytes") and length != entry["bytes"]):
                raise IOError("response length does not match preflight")
            partial.replace(target)
            entry["status"] = "downloaded"
            entry["downloaded_bytes"] = length
            return entry
        except Exception as exc:
            partial.unlink(missing_ok=True)
            if attempt == 3:
                entry["status"] = "download_error"
                entry["error"] = type(exc).__name__
                return entry
            time.sleep(2 * (attempt + 1))
    return entry


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reciter", type=int, action="append", help="MP3Quran catalog id; may be repeated (default: 1, the app's first/default entry)")
    parser.add_argument("--all", action="store_true", help="mirror all 158 catalog recitations; preflight and disk-check first")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error("--workers must be between 1 and 8")
    ids = range(1, 159) if args.all else (args.reciter or [1])
    manifest = {"schema": 1, "source": "MP3Quran.net", "source_policy": "https://www.mp3quran.net/eng/privacy",
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "reciters": []}
    for rid in ids:
        identity, entries = catalog(rid)
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            entries = list(pool.map(inspect, entries))
        available = [row for row in entries if row["status"] == "available"]
        total = sum(row.get("bytes") or 0 for row in available)
        free = shutil.disk_usage(args.cache.parent if args.cache.parent.exists() else ROOT).free
        print(f"reciter {rid} {identity.get('name')}: {len(available)}/114 files; known size {total:,} bytes ({total / 1e9:.2f} GB); free disk {free / 1e9:.2f} GB")
        manifest["reciters"].append({**identity, "tracks": entries, "planned_bytes": total})
    args.cache.mkdir(parents=True, exist_ok=True)
    manifest_path = args.cache / ("manifest-all.json" if args.all else "manifest.json")
    if not args.all and manifest_path.exists():
        try:
            previous = json.loads(manifest_path.read_text(encoding="utf-8"))
            existing = {int(item["id"]): item for item in previous.get("reciters", [])}
            existing.update({int(item["id"]): item for item in manifest["reciters"]})
            manifest["reciters"] = [existing[key] for key in sorted(existing)]
        except (OSError, ValueError, KeyError, TypeError):
            pass
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(reciter["planned_bytes"] for reciter in manifest["reciters"])
    free = shutil.disk_usage(args.cache).free
    required = int(total * 1.1)  # headroom for .part files and filesystem overhead
    print(f"Total preflight: {total:,} bytes ({total / 1e9:.2f} GB); required with headroom: {required / 1e9:.2f} GB; available: {free / 1e9:.2f} GB")
    if args.preflight_only:
        return 0
    if total == 0 or required > free:
        print("Download stopped: corpus size is unknown/empty or exceeds available disk space.", file=sys.stderr)
        return 2
    for reciter in manifest["reciters"]:
        tracks = [row for row in reciter["tracks"] if row["status"] == "available"]
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            results = list(pool.map(lambda row: download(row, args.cache), tracks))
        reciter["tracks"] = [next((result for result in results if result["surah"] == row["surah"]), row) for row in reciter["tracks"]]
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        completed = sum(r.get("downloaded_bytes", 0) for r in results if r["status"] == "downloaded")
        failed = [r for r in results if r["status"] != "downloaded"]
        print(f"reciter {reciter['id']}: downloaded {len(results) - len(failed)}/{len(results)} ({completed:,} bytes); manifest checkpointed")
    return int(any(t["status"] != "downloaded" for r in manifest["reciters"] for t in r["tracks"]))


if __name__ == "__main__":
    raise SystemExit(main())
