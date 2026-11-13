#!/usr/bin/env python3
"""AI.NEWS teleprompter + alternating host/B-roll storyboard generator.

Safe by default: this produces DRAFTS, not validated facts or published video.
It never fabricates capability claims or licenses.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

def valid_source(url: str) -> bool:
    p = urlparse(url)
    return p.scheme == "https" and bool(p.hostname) and p.hostname not in {"localhost", "127.0.0.1"}

def timestamp(seconds: float) -> str:
    ms = round(seconds * 1000)
    return f"{ms//3600000:02d}:{(ms//60000)%60:02d}:{(ms//1000)%60:02d},{ms%1000:03d}"

def build(record: dict) -> dict:
    story = record.get("story", record)
    title = str(story.get("title") or "").strip()
    source = str(story.get("source") or "").strip()
    url = str(story.get("url") or "").strip()
    if not title or not source:
        raise ValueError("A sourced news title and publisher are required")
    claims = record.get("verified_facts", [])
    if not isinstance(claims, list):
        raise ValueError("verified_facts must be a list")
    safe_claims = []
    for claim in claims[:4]:
        if not isinstance(claim, dict):
            continue
        fact = str(claim.get("fact", "")).strip()
        citation = str(claim.get("source_url", "")).strip()
        if fact and valid_source(citation) and claim.get("checked_by_editor") is True:
            safe_claims.append({"fact": fact, "source_url": citation})
    claim_pass = len(safe_claims) >= 2
    is_source = valid_source(url)
    rights_ok = record.get("demo_footage_rights_cleared") is True
    final_editor_approved = record.get("owner_approved") is True
    fully_ready = bool(claim_pass and is_source and rights_ok and final_editor_approved)
    scenes = [
        {
            "shot": "BRAND_INTRO", "duration_s": 3,
            "host_text": "AI.NEWS by Telcohauz. Dari sejarah AI kepada teknologi hari ini.",
            "visual": "Original AI.NEWS logo animation and original licensed soundtrack",
            "display_label": "AI.NEWS | TELCOHAUZ",
        },
        {
            "shot": "HOST", "duration_s": 7,
            "host_text": f"Teknologi AI semakin berkembang. Hari ini kita meneliti satu pengumuman daripada {source}.",
            "visual": "Fictional AI presenter, licensed voice, clearly disclosed when needed",
            "display_label": "HOS AI.NEWS",
        },
        {
            "shot": "B_ROLL", "duration_s": 6,
            "host_text": f"Tajuk yang diterbitkan: {title}. Kita semak bukti sebelum membuat kesimpulan.",
            "visual": "Original typographic news card with attributed link; no copied footage",
            "display_label": "BERITA • SUMBER RASMI" if is_source else "DRAF • SUMBER BELUM DISAHKAN",
        },
        {
            "shot": "HOST", "duration_s": 6,
            "host_text": "Apakah kemampuan sebenar AI yang telah dibuktikan? Mari lihat fakta yang boleh disahkan.",
            "visual": "AI presenter speaking with lip-sync only if proper rendering is available",
            "display_label": "APA AI BOLEH BUAT?",
        },
        {
            "shot": "REAL_DEMO" if rights_ok else "ILLUSTRATION",
            "duration_s": 8,
            "host_text": " ".join(x["fact"] for x in safe_claims[:2]) if claim_pass else
                         "Demonstrasi sebenar belum disahkan. Visual ini hanya ilustrasi, bukan bukti kemampuan produk.",
            "visual": "Footage from rights-cleared source" if rights_ok else "Original illustration ONLY; label clearly as illustration",
            "display_label": "DEMO SEBENAR" if rights_ok and claim_pass else "ILUSTRASI • BUKAN DEMO SEBENAR",
            "sources": safe_claims[:2],
        },
        {
            "shot": "HOST", "duration_s": 7,
            "host_text": "Ingat, kemampuan sistem AI mempunyai batas. Semak tarikh, versi dan sumber rasmi sebelum mencuba.",
            "visual": "AI presenter closing explanation",
            "display_label": "SEMAK FAKTA DAN BATASAN",
        },
        {
            "shot": "OUTRO", "duration_s": 4,
            "host_text": "Ikuti AI.NEWS by Telcohauz untuk perkembangan AI seterusnya.",
            "visual": "Original logo lockup with CTA; no manipulative engagement bait",
            "display_label": "AI.NEWS | TELCOHAUZ",
        },
    ]
    if not fully_ready:
        # Never allow the provenance of a headline or model-created imagery to
        # be confused with a publishable verified news report.
        scenes.insert(0, {
            "shot": "REVIEW_BANNER", "duration_s": 3,
            "host_text": "Draf editorial. Belum untuk penerbitan.",
            "visual": "Full-frame visible DRAF label",
            "display_label": "DRAF • PERLU SEMAKAN",
        })
    return {
        "project": "AI.NEWS by Telcohauz",
        "story": {"title": title, "publisher": source, "url": url},
        "publish_allowed": fully_ready,
        "editorial_status": "READY_FOR_MANUAL_RELEASE" if fully_ready else "BLOCKED_REVIEW",
        "issues": ([] if fully_ready else [
            reason for condition, reason in (
                (is_source, "Article requires a valid primary HTTPS URL"),
                (claim_pass, "At least two sourced, editor-checked capability facts required"),
                (rights_ok, "Footage usage rights not cleared"),
                (final_editor_approved, "Owner has not approved episode")
            ) if not condition]),
        "scenes": scenes,
    }

def render_script(plan: dict) -> str:
    result = ["# AI.NEWS Teleprompter — Editorial Draft", "",
              f"Headline: {plan['story']['title']}",
              f"Source: {plan['story']['url'] or 'NOT PROVIDED'}",
              f"Status: {plan['editorial_status']}", ""]
    for i, scene in enumerate(plan["scenes"], 1):
        result.extend([f"## {i}. {scene['shot']} ({scene['duration_s']} sec)",
                       f"Visual: {scene['visual']}", "",
                       scene["host_text"], ""])
    if plan["issues"]:
        result.extend(["## Must resolve before publishing"] + ["- " + s for s in plan["issues"]])
    return "\n".join(result) + "\n"

def render_srt(plan: dict) -> str:
    cursor = 0
    lines = []
    for i, scene in enumerate(plan["scenes"], 1):
        end = cursor + scene["duration_s"]
        lines += [str(i), f"{timestamp(cursor)} --> {timestamp(end)}", scene["host_text"], ""]
        cursor = end
    return "\n".join(lines)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="JSON candidate or editor-verified record")
    p.add_argument("--out", default="teleprompter-output")
    args=p.parse_args()
    record=json.loads(Path(args.input).read_text(encoding="utf-8"))
    plan=build(record)
    out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    (out/"storyboard.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2),encoding="utf-8")
    (out/"teleprompter.md").write_text(render_script(plan),encoding="utf-8")
    (out/"subtitles.srt").write_text(render_srt(plan),encoding="utf-8")
    print("Storyboarding complete; status: " + plan["editorial_status"])
    if not plan["publish_allowed"]:
        print("Publishing blocked: " + "; ".join(plan["issues"]))

if __name__ == "__main__":
    main()
