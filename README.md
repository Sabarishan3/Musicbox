# ▶ PIXELBEAT — Arcade Audio

Retro-arcade music player that streams free music from YouTube via the official
(embed, ToS-compliant) YouTube player. Pure HTML/CSS/JS — zero dependencies, zero build step.

## Run it

```bash
cd "music player proto"
python3 -m http.server 8000
```

Open **http://localhost:8000** — best in a **mobile viewport** (DevTools → device toolbar, e.g. iPhone 14).

## First boot (INSERT COIN)

The app has two modes:

1. **FULL MODE — live YouTube search**
   Free key, ~1 minute: [console.cloud.google.com](https://console.cloud.google.com)
   → new project → enable **YouTube Data API v3** → Credentials → **API key** → paste in boot screen.
   Free quota ≈ 100 searches/day (10,000 units, search = ~101 units).

2. **LINK MODE — no key needed**
   Pick "LINK MODE START" and paste any `youtube.com/watch?v=…` URL into the search bar.
   Playing a link never touches the search API.

## What's inside

| File | Role |
|---|---|
| `index.html` | app shell · 3 screens · now-playing overlay · modals |
| `styles.css` | design system from `DESIGN.md` (CRT scanlines, pixel decks) |
| `js/store.js` | favorites/playlists/recents/counts/settings — localStorage |
| `js/player.js` | YouTube IFrame engine: queue · shuffle · loop · seek · media-session |
| `js/api.js` | live search + link parsing + quota accounting |
| `js/ui.js` | screens, VU meter, scrubber, queue, boot flow |

Design notes: hidden player is `opacity:.01` not `display:none` so audio survives
the Now-Playing overlay closing. Search results are cached per query to save quota.
Keyboard: `space` play · `←/→` seek · `n/p` track · `/` search · `esc` close.
