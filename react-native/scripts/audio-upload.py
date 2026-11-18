#!/usr/bin/env python3
"""Upload a completed audio-mirror manifest to Supabase Storage or an HTTP PUT origin.

Credentials are read from environment variables and are never printed. Paths are
stable (`audio/<reciter-id>/<NNN>.mp3`) so static VPS hosting can use the same layout.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=Path(__file__).resolve().parents[1] / "audio-cache" / "manifest.json")
    parser.add_argument("--backend", choices=("supabase", "put"), required=True)
    parser.add_argument("--bucket", default="quran-audio")
    parser.add_argument("--endpoint", help="Supabase project URL for storage, or HTTP origin for --backend put")
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error("--workers must be between 1 and 8")
    endpoint = args.endpoint or os.environ.get("AUDIO_UPLOAD_ENDPOINT", "")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    if args.backend == "supabase":
        token = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        anon = os.environ.get("SUPABASE_ANON_KEY", "")
        if not endpoint or not (token or anon):
            print("Missing AUDIO_UPLOAD_ENDPOINT and/or Supabase upload credentials in environment.", file=sys.stderr)
            return 2
        headers = {"Authorization": f"Bearer {token or anon}", "apikey": token or anon}
        base = endpoint.rstrip("/") + "/storage/v1/object/" + urllib.parse.quote(args.bucket, safe="")
    else:
        token = os.environ.get("AUDIO_UPLOAD_BEARER_TOKEN", "")
        if not endpoint:
            print("Missing AUDIO_UPLOAD_ENDPOINT.", file=sys.stderr)
            return 2
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        base = endpoint.rstrip("/")
    if args.backend == "supabase" and not token:
        print("SUPABASE_SERVICE_ROLE_KEY is recommended for server-side uploads; authenticated Storage policy may permit anon key only for a signed-in user.", file=sys.stderr)

    if manifest.get("kind") == "ayah":
        tracks = [(manifest.get("reciter_id", "alafasy"), t) for t in manifest.get("tracks", []) if t.get("status") == "downloaded"]
    else:
        tracks = [(r["id"], t) for r in manifest.get("reciters", []) for t in r.get("tracks", []) if t.get("status") == "downloaded"]
    if not tracks:
        print("Manifest has no completed tracks; run the resumable mirror first.", file=sys.stderr)
        return 2
    failed = 0
    for reciter_id, track in tracks:
        local = args.manifest.parent / track["file"]
        if not local.is_file() or (track.get("downloaded_bytes") and local.stat().st_size != track["downloaded_bytes"]):
            print(f"Skip {track['file']}: missing or size changed")
            failed += 1
            continue
        object_path = track.get("object_path") or f"audio/{reciter_id}/{Path(track['file']).name}"
        url = f"{base}/{urllib.parse.quote(object_path, safe='/')}" if args.backend == "supabase" else f"{base}/{urllib.parse.quote(object_path, safe='/')}"
        content_type = "audio/mpeg"
        for attempt in range(4):
            try:
                req_headers = {**headers, "Content-Type": content_type}
                if args.backend == "supabase":
                    req_headers["x-upsert"] = "true"
                    method = "POST"
                else:
                    method = "PUT"
                req = urllib.request.Request(url, data=local.read_bytes(), headers=req_headers, method=method)
                with urllib.request.urlopen(req, timeout=180) as response:
                    if response.status not in (200, 201, 204):
                        raise RuntimeError(f"HTTP {response.status}")
                print(f"Uploaded {object_path}")
                break
            except Exception as exc:
                if attempt == 3:
                    print(f"Upload failed for {object_path}: {type(exc).__name__}", file=sys.stderr)
                    failed += 1
                else:
                    time.sleep((attempt + 1) * 2)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
