# AI.NEWS by Telcohauz — two daily draft slots

**Stage 1: safe draft generator, not a live posting bot.**

## Owner's operating schedule

- 12:13 MYT (04:13 UTC) — noon news draft
- 20:17 MYT (12:17 UTC) — evening news draft
- Publish goal: **up to 2 original videos/day** only after research, copyright review, OAuth and owner approval.
- Long-term milestone: 100,000 genuine Facebook followers **or** 100,000 genuine YouTube subscribers; never guaranteed.
- Cloud: GitHub Actions. Scheduled workflows **run on default branch only** after the pull request is merged, and can be delayed or disabled.
- Costs: RM0 additional fees as a constraint; use free eligible CI allowance. No billable service is automatically provisioned.

## What already works in this prototype

1. Read RSS/Atom announcements from a fixed allowlist of primary publisher sites.
2. Discard stale, off-topic, non-HTTPS, or untrusted-source headlines.
3. Produce a JSON story candidate for each slot with source URL, date and editorial review status.
4. Render an original vertical 720x1280, 15-second **watermarked visual DRAFT**, with FFmpeg/Pillow.
5. Execute unit tests, and save the drafts as a GitHub Actions artifact for inspection.
6. Fail closed when sources are unavailable. Never fabricate updates or automatically post.

**Important**: RSS headlines alone are not a fact-check. Video cards are visual layout previews, NOT ready-to-publish news explainers. This stage does **not** use footage, audio, commercial affiliate links, account credentials or synthetic 'real-life' demos.

## Local test

```bash
cd apps/ai-news
python -m pip install -r requirements.txt
python -m unittest discover -v
python engine.py --demo --out output
python engine.py --slot midday --out output  # real official feeds, needs network
```

Needs Python >=3.11, FFmpeg and DejaVuSans-Bold.


## Host + visual intercut video format (teleprompter tool)

`teleprompter.py` accepts `output/candidate.json` or an editor-checked JSON story and emits:
- `storyboard.json`: BRAND INTRO -> HOST -> B-ROLL -> HOST -> RIGHTS-CLEARED DEMO -> HOST -> OUTRO.
- `teleprompter.md`: Malay-language presenter cues, narration and source references.
- `subtitles.srt`: editable subtitles and timeline.

Usage: `python teleprompter.py --input output/candidate.json --out output/teleprompter`

An RSS headline alone is **never** enough for an actual news video. Unless sourced claims, footage rights and owner approval are present, the generator marks it `BLOCKED_REVIEW`, inserts a prominent review banner and labels unverified video as **illustration**. It cannot render an actual talking lip-synced news presenter without a separate, authorized voice/avatar renderer. The owner-facing proof-of-concept MP4 in the conversation uses original visuals and offline synthetic narration; it is not a live news report.

## Required next integrations (NOT complete)

- Persistent private queue and dedupe state across cloud runs.
- Full verification of every claimed capability from original announcements.
- Approved reusable original demonstration assets and source-footage permission registry.
- High-quality Bahasa Melayu narration, original commentary, licensed audio.
- A publish-ready YouTube uploader with an **authorized uploader OAuth credential** (vidIQ connection in ChatGPT is not a GitHub Actions secret).
- Facebook Page posting via authorized API after confirmed Page and permissions.
- Private comment ingestion and approved factual reply queue, with limits and escalation.
- Analytics based on actual platform data, and two-check milestone stop logic.
- Dashboard + logs + emergency pause + per-platform policy flags.

Never put credentials in this public repository. Keep publication OFF until credentials, rights, permissions and dry-runs are independently verified.

### Security rules

Do not publish recycled third-party clips, fabricated live demonstrations, invented news, repetitive affiliate ads, bot replies or fake engagement. A publicly viewable video is **not** proof of a reuse license.

To enable scheduled draft generation, review and merge this feature branch into the repository's default branch. Schedule triggers cannot run from a feature branch. Actual publication requires a separate explicitly approved deployment and is not implemented here.
