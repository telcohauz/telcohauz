#!/usr/bin/env python3
"""Prepend the SAME approved AI.NEWS bumper to every completed episode.

Requires a pre-provisioned locked master MP4; never generates a new intro.
Creates local output only. No platform publishing.
"""
from __future__ import annotations
import argparse
import hashlib
from pathlib import Path
import subprocess

LOCKED = {
    "vertical": {
        "name": "AI_NEWS_INTRO_MASTER_9x16.mp4",
        "sha256": "efdc6876273ce303bd1a39136a369c1ed41f1c7ceab623ab46b574ebf5c454dd",
        "width": 720, "height": 1280,
    },
    "landscape": {
        "name": "AI_NEWS_INTRO_MASTER_16x9.mp4",
        "sha256": "f1082d96e2f013de2b020d67b8f4de7a5dc052a4ab55a9f43393cdf928a7e561",
        "width": 1280, "height": 720,
    },
}

def check_master(path: Path, kind: str) -> None:
    if path.name != LOCKED[kind]["name"]:
        raise ValueError("Only the approved fixed intro filename is allowed")
    if not path.is_file():
        raise FileNotFoundError("Approved fixed intro MP4 missing; no replacement is generated")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != LOCKED[kind]["sha256"]:
        raise ValueError("Intro checksum changed; refusing to produce an episode")

def concatenate(intro: Path, body: Path, out: Path, kind: str) -> None:
    check_master(intro, kind)
    if not body.is_file():
        raise FileNotFoundError("Episode body is missing")
    if intro.resolve() == out.resolve() or body.resolve() == out.resolve():
        raise ValueError("Output must not overwrite the source assets")
    w, h = LOCKED[kind]["width"], LOCKED[kind]["height"]
    out.parent.mkdir(parents=True, exist_ok=True)
    filter_graph = (
        f"[0:v:0]fps=24,scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v0];"
        f"[1:v:0]fps=24,scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1[v1];"
        "[0:a:0]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a0];"
        "[1:a:0]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a1];"
        "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]"
    )
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(intro), "-i", str(body), "-filter_complex", filter_graph,
        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart", str(out)
    ], check=True)

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--intro", type=Path, required=True)
    p.add_argument("--episode", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--format", choices=LOCKED, default="vertical")
    args=p.parse_args()
    concatenate(args.intro, args.episode, args.output, args.format)
    print(f"Fixed AI.NEWS intro prepended. Draft file: {args.output}")
