# AI.NEWS fixed intro: LOCKED brand asset

The same intro must be included in EVERY AI.NEWS episode and must **not** change with news stories, host scripts or posting date.

- Vertical Shorts / Facebook Reels: `AI_NEWS_INTRO_MASTER_9x16.mp4` (4.54 s)
- Landscape YouTube episodes: `AI_NEWS_INTRO_MASTER_16x9.mp4` (4.54 s)
- Brand: AI.NEWS | TELCOHAUZ; original futuristic ident music and effects; **no computer-generated spoken announcer**.
- A human presenter enters *after* this fixed bumper. Teleprompter content changes per story; the bumper never changes.
- The completed master MP4 is an owner-approved private project asset delivered via the ChatGPT conversation. It **has not yet been uploaded** into GitHub.
- Never regenerate a lookalike or silently replace the original MP4. Hash-check its exact content before use; keep it in approved private media storage.
- Use `compose_episode.py` after original host/intercut footage has been fully approved and rendered with audio. This step does not post content.
- Example: `python compose_episode.py --intro /secure-assets/AI_NEWS_INTRO_MASTER_9x16.mp4 --episode /work/approved_episode.mp4 --output /work/final_episode.mp4 --format vertical`
- If the locked intro is missing or changed, **fail closed**; do not publish an episode.

No production account, video post, or fully unattended pipeline is activated by this change.
