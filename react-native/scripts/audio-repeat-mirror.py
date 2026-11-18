#!/usr/bin/env python3
"""Resumable mirror for EveryAyah verse-by-verse clips (default Alafasy Hafs set)."""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "audio-cache"
VERSE_COUNTS_FILE = ROOT / "src" / "domain" / "quran.ts"
BASE_URL = "https://everyayah.com/data/Alafasy_128kbps"
HEADERS = {"User-Agent": "WirdnaAudioMirror/1.0 (Quran audio attribution preserved)"}


def source_tracks() -> list[dict]:
    source = VERSE_COUNTS_FILE.read_text(encoding="utf-8-sig")
    match = re.search(r"export const verseCounts = \[(.*?)\] as const", source, flags=re.S)
    if not match:
        raise RuntimeError("Could not parse Quran verse counts")
    counts = [int(value) for value in re.findall(r"\d+", match.group(1))]
    if len(counts) != 114:
        raise RuntimeError(f"Expected 114 surah counts; found {len(counts)}")
    tracks = []
    for surah, ayah_count in enumerate(counts, start=1):
        for ayah in range(1, ayah_count + 1):
            name = f"{surah:03}{ayah:03}.mp3"
            tracks.append({"surah": surah, "ayah": ayah, "url": f"{BASE_URL}/{name}",
                           "source_url": f"{BASE_URL}/{name}", "file": f"ayah/alafasy/{name}",
                           "object_path": f"audio/ayah/alafasy/{name}", "status": "pending", "bytes": None})
    return tracks


def probe(track: dict) -> dict:
    try:
        request = urllib.request.Request(track["url"], headers=HEADERS, method="HEAD")
        with urllib.request.urlopen(request, timeout=25) as response:
            track["status"] = "available" if response.status == 200 else f"http_{response.status}"
            track["bytes"] = int(response.headers.get("Content-Length", 0)) or None
    except urllib.error.HTTPError as exc:
        track["status"] = f"http_{exc.code}"
    except Exception as exc:
        track["status"] = "head_error"
        track["error"] = type(exc).__name__
    return track


def fetch(track: dict) -> dict:
    path = CACHE / track["file"]
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and (track["bytes"] is None or path.stat().st_size == track["bytes"]):
        track["status"] = "downloaded"
        track["downloaded_bytes"] = path.stat().st_size
        return track
    for attempt in range(4):
        try:
            request = urllib.request.Request(track["url"], headers=HEADERS)
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
            if len(data) < 1024 or (track["bytes"] and len(data) != track["bytes"]):
                raise IOError("response size differs from preflight")
            temporary = path.with_suffix(".mp3.part")
            temporary.write_bytes(data)
            temporary.replace(path)
            track["status"] = "downloaded"
            track["downloaded_bytes"] = len(data)
            return track
        except Exception as exc:
            if attempt == 3:
                track["status"] = "download_error"
                track["error"] = type(exc).__name__
            else:
                time.sleep((attempt + 1) * 1.5)
    return track


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error("--workers must be between 1 and 8")
    manifest_path = CACHE / "repeat-manifest.json"
    old_manifest = {}
    if manifest_path.exists():
        try:
            old_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            old_manifest = {}
    previous = {(t["surah"], t["ayah"]): t for t in old_manifest.get("tracks", [])}
    tracks = source_tracks()
    for track in tracks:
        existing = previous.get((track["surah"], track["ayah"]))
        if existing:
            track.update({k: existing[k] for k in ("bytes", "downloaded_bytes") if k in existing})
            if existing.get("status") == "downloaded" and (CACHE / track["file"]).exists():
                track["status"] = "downloaded"
                continue
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        pending = [track for track in tracks if track["status"] != "downloaded"]
        list(pool.map(probe, pending))
    total = sum(track.get("bytes") or 0 for track in tracks if track["status"] == "available")
    available = sum(track["status"] in ("available", "downloaded") for track in tracks)
    required = int(total * 1.1)
    free = shutil.disk_usage(CACHE).free if CACHE.exists() else shutil.disk_usage(ROOT).free
    manifest = {
        "schema": 1, "kind": "ayah", "reciter_id": "alafasy", "reciter": "Mishary Alafasy",
        "source": "EveryAyah.com", "source_url": "https://everyayah.com/",
        "attribution": "Recitation by Mishary Alafasy. Audio source: EveryAyah.com. Link to https://everyayah.com/.",
        "rights_note": "EveryAyah recommends attribution and backlinking; no explicit site-wide redistribution license was identified. Confirm rights before public hosting.",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "track_count": len(tracks),
        "planned_bytes": total, "tracks": tracks,
    }
    CACHE.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Alafasy verse corpus: {available}/{len(tracks)} available/downloaded; known transfer {total:,} bytes ({total / 1e9:.2f} GB); required with headroom {required / 1e9:.2f} GB; disk free {free / 1e9:.2f} GB")
    if args.preflight_only:
        return 0
    if required > free or total == 0:
        print("Download stopped: corpus size is unknown/empty or exceeds free disk with safety headroom.")
        return 2
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(fetch, [track for track in tracks if track["status"] == "available"]))
    result_map = {(track["surah"], track["ayah"]): track for track in results}
    manifest["tracks"] = [result_map.get((track["surah"], track["ayah"]), track) for track in tracks]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    done = sum(track["status"] == "downloaded" for track in manifest["tracks"])
    print(f"Downloaded {done}/{len(tracks)} ayah clips; manifest checkpointed")
    return int(done != len(tracks))


if __name__ == "__main__":
    raise SystemExit(main())
