#!/usr/bin/env python3
"""AI.NEWS safe news-discovery and original typographic video DRAFT pipeline.

No posting code is executed. Official RSS headlines are NOT treated as
fact-checked news scripts. Each result requires human editorial approval.
"""
from __future__ import annotations
import argparse
import datetime as dt
import email.utils
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import textwrap
import urllib.request
import xml.etree.ElementTree as ET

SOURCES = [
    {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/"},
    {"name": "Google DeepMind", "url": "https://deepmind.google/blog/rss.xml"},
    {"name": "Microsoft Research", "url": "https://www.microsoft.com/en-us/research/feed/"},
]
SAFE_DOMAINS = {"blog.google", "deepmind.google", "www.microsoft.com"}
MAX_ITEMS_PER_SOURCE = 30
MALAYSIA_TZ = dt.timezone(dt.timedelta(hours=8))
NEWS_WORDS = ("ai", "artificial intelligence", "gemini", "robot", "machine learning",
              "model", "generative", "deep learning", "research")

def safe_source(source):
    from urllib.parse import urlparse
    p = urlparse(source["url"])
    return p.scheme == "https" and p.hostname in SAFE_DOMAINS

def parse_date(raw):
    if not raw:
        return None
    try:
        return email.utils.parsedate_to_datetime(raw).astimezone(dt.timezone.utc)
    except (TypeError, ValueError, OverflowError):
        try:
            return dt.datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
        except ValueError:
            return None

def short_text(value, n=220):
    return re.sub(r"\s+", " ", value or "").strip()[:n]

def harvest(source, opener=urllib.request.urlopen):
    if not safe_source(source):
        raise ValueError("Blocked non-allowlisted feed")
    request = urllib.request.Request(source["url"], headers={
        "User-Agent": "TelcohauzAINewsResearch/0.1 (+owner-managed editorial workflow)"
    })
    with opener(request, timeout=12) as response:
        payload = response.read(1_000_000)
    root = ET.fromstring(payload)
    items = []
    entries = root.findall(".//item")[:MAX_ITEMS_PER_SOURCE]
    atom = False
    if not entries:
        entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")[:MAX_ITEMS_PER_SOURCE]
        atom = True
    for entry in entries:
        if atom:
            title = entry.findtext("{http://www.w3.org/2005/Atom}title", "")
            link_element = entry.find("{http://www.w3.org/2005/Atom}link")
            url = link_element.attrib.get("href", "") if link_element is not None else ""
            published = entry.findtext("{http://www.w3.org/2005/Atom}published", "") or entry.findtext("{http://www.w3.org/2005/Atom}updated", "")
        else:
            title = entry.findtext("title", "")
            url = entry.findtext("link", "")
            published = entry.findtext("pubDate", "")
        from urllib.parse import urlparse
        domain = urlparse(url).hostname or ""
        # Exclude outside domains and non-HTTPS links, including link shorteners.
        if not url.startswith("https://") or domain not in SAFE_DOMAINS:
            continue
        title = short_text(title, 160)
        if not title or not any(word in title.casefold() for word in NEWS_WORDS):
            continue
        published_dt = parse_date(published)
        if published_dt is None:
            continue
        now = dt.datetime.now(dt.timezone.utc)
        if not (now - dt.timedelta(days=21) <= published_dt <= now + dt.timedelta(days=1)):
            continue
        item_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]
        items.append({
            "id": item_id, "title": title, "source": source["name"], "url": url,
            "published_at": published_dt.isoformat(), "type": "source_headline",
            "verification": "PRIMARY_FEED_HEADLINE_ONLY",
            "rights_status": "NOT_ASSESSED", "owner_approved": False,
            "publish_allowed": False
        })
    return items

def choose(candidates, date, slot):
    unique = {x["id"]: x for x in candidates}
    ordered = sorted(unique.values(), key=lambda x: (x["published_at"], x["id"]), reverse=True)
    if not ordered:
        raise ValueError("No recent official AI feed items available; do not fabricate news")
    index = ((date.toordinal() * 2) + (0 if slot == "midday" else 1)) % len(ordered)
    return ordered[index]

def resolved_slot(slot, today):
    if slot != "auto":
        return slot
    return "midday" if today.hour < 16 else "evening"

def script_card(story):
    return [
        "AI.NEWS | TELCOHAUZ",
        "BERITA AI TERKINI",
        story["title"],
        "Sumber rasmi: " + story["source"],
        "DRAF • Fakta terperinci & hak penggunaan belum disemak",
        "JANGAN TERBIT SEBELUM DILULUSKAN",
    ]

def render_preview(story, output_dir):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as exc:
        raise RuntimeError("pip install Pillow") from exc
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg required for MP4 preview")
    font_file = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if not Path(font_file).exists():
        raise RuntimeError("DejaVuSans-Bold font required")
    output_dir.mkdir(parents=True, exist_ok=True)
    fonts = {
        "large": ImageFont.truetype(font_file, 64),
        "medium": ImageFont.truetype(font_file, 42),
        "small": ImageFont.truetype(font_file, 27),
    }
    scenes = [
        ("AI.NEWS", "BERITA AI TERKINI", "Sumber rasmi • " + story["source"]),
        ("PENGUMUMAN", story["title"], "Baca sumber asal sebelum membuat kesimpulan"),
        ("SEMAK SUMBER", story["source"], "Draf sahaja • Tidak boleh diterbitkan"),
    ]
    segments = []
    for idx, (header, headline, footer) in enumerate(scenes):
        im = Image.new("RGB", (720, 1280), (7, 15, 42))
        draw = ImageDraw.Draw(im)
        for y in range(1280):
            draw.line((0, y, 720, y), fill=(7 + y // 220, 18 + y // 150, 40 + y // 55))
        draw.rounded_rectangle((35, 65, 685, 145), radius=20, fill=(7, 100, 152))
        draw.text((65, 84), header, font=fonts["medium"], fill=(250, 255, 255))
        words, lines, line = headline.split(), [], ""
        for word in words:
            attempt = (line + " " + word).strip()
            if draw.textbbox((0, 0), attempt, font=fonts["large"])[2] > 625 and line:
                lines.append(line)
                line = word
            else:
                line = attempt
        if line:
            lines.append(line)
        if len(lines) > 7:
            lines = lines[:6] + ["..."]
        start = 350 - max(0, (len(lines) - 3) * 36)
        for n, line in enumerate(lines):
            draw.text((42, start + n * 88), line, font=fonts["large"], fill=(255, 255, 255))
        draw.text((42, 1040), short_text(footer, 48), font=fonts["small"], fill=(105, 236, 241))
        draw.rectangle((0, 1170, 720, 1280), fill=(130, 33, 56))
        draw.text((34, 1198), "DRAF - TIDAK UNTUK POSTING", font=fonts["small"], fill=(255, 255, 255))
        png = output_dir / f"slide-{idx}.png"
        mp4 = output_dir / f"scene-{idx}.mp4"
        im.save(png)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                        "-loop", "1", "-framerate", "25", "-i", str(png),
                        "-t", "5", "-c:v", "libx264", "-preset", "veryfast",
                        "-pix_fmt", "yuv420p", str(mp4)], check=True)
        segments.append(mp4)
    listing = output_dir / "concat.txt"
    listing.write_text("".join("file '" + seg.resolve().as_posix() + "'\n" for seg in segments), encoding="utf-8")
    target = output_dir / "AI-NEWS-DRAFT.mp4"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "concat", "-safe", "0", "-i", str(listing),
                    "-c", "copy", str(target)], check=True)
    return target

def demo_items():
    date = dt.datetime.now(dt.timezone.utc).isoformat()
    return [{
        "id": hashlib.sha256(str(i).encode()).hexdigest()[:20],
        "title": title, "source": "DEMO - NOT A NEWS SOURCE",
        "url": "", "published_at": date, "type": "synthetic_test_data",
        "verification": "UNVERIFIED_DEMO", "rights_status": "NOT_ASSESSED",
        "owner_approved": False, "publish_allowed": False
    } for i, title in enumerate(("Contoh tajuk AI untuk ujian sistem sahaja",
                                  "Demo grafik video berita teknologi AI"))]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", choices=["auto", "midday", "evening"], default="auto")
    parser.add_argument("--out", default="ai-news-output")
    parser.add_argument("--demo", action="store_true", help="offline non-factual pipeline test")
    parser.add_argument("--no-video", action="store_true")
    args = parser.parse_args()
    if os.environ.get("AI_NEWS_ALLOW_PUBLISH", "false").lower() != "false":
        raise SystemExit("Publishing is not implemented. Keep AI_NEWS_ALLOW_PUBLISH=false")
    now = dt.datetime.now(MALAYSIA_TZ)
    slot = resolved_slot(args.slot, now)
    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)
    errors = []
    if args.demo:
        candidates = demo_items()
    else:
        candidates = []
        for source in SOURCES:
            try:
                candidates.extend(harvest(source))
            except (ET.ParseError, OSError, ValueError, TimeoutError) as exc:
                errors.append(f"{source['name']}: {type(exc).__name__}: {exc}")
        if not candidates:
            (output_dir / "source-errors.json").write_text(json.dumps(errors, indent=2), encoding="utf-8")
            raise SystemExit("No recent verified-source headlines. No video created.")
    selected = choose(candidates, now.date(), slot)
    record = {"generated_at": now.isoformat(), "slot": slot, "story": selected,
              "editorial_lines": script_card(selected), "editorial_status": "NEEDS_REVIEW",
              "owner_approved": False, "publish_allowed": False,
              "next_steps": ["verify entire primary announcement", "add original commentary",
                             "clear visual/audio rights", "approve final publication"]}
    (output_dir / "candidate.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "feed-candidates.json").write_text(json.dumps(candidates, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_dir / "source-errors.json").write_text(json.dumps(errors, indent=2), encoding="utf-8")
    if not args.no_video:
        target = render_preview(selected, output_dir)
        print("Rendered: " + str(target))
    print("Created editorial DRAFT only; no publishing or comment posting.")
    print("Slot: " + slot + " | Source: " + selected["source"])

if __name__ == "__main__":
    main()
