# ▶ PIXELBEAT — Arcade Audio

A retro-arcade music player that streams free music from YouTube through the **official embedded YouTube player** (ToS-compliant). Built with plain HTML, CSS, and JavaScript: **zero dependencies, zero build step.**

CRT scanlines, pixel-art decks, a VU meter, and a mobile-first layout.

---

## Features

- **Live YouTube search** (optional) with per-query result caching to conserve API quota
- **Link mode:** paste any `youtube.com/watch?v=…` URL and play it with no API key
- **Playback engine:** queue, shuffle, loop, seek, next/previous
- **Media Session support:** lock-screen and hardware media controls
- **Library:** favorites, playlists, recents, and play counts
- **Now-Playing overlay** with VU meter and scrubber
- **Background audio:** closing the overlay doesn't stop playback
- **Keyboard shortcuts** for everything you'd expect
- **Persistent state** via `localStorage`, with no backend and no accounts

---

## Quick Start

Requirements: any modern browser and a way to serve static files (Python 3 is shown below, but any static server works).

```bash
cd "music player proto"
python3 -m http.server 8000
```

Open **http://localhost:8000**.

> **Tip:** PIXELBEAT is designed for mobile. On desktop, open DevTools → device toolbar and pick a phone viewport (e.g. iPhone 14) for the intended layout.

> **Note:** Serve the app over HTTP rather than opening `index.html` directly from disk. The YouTube IFrame API generally needs a real origin (`http://localhost` works).

---

## First Boot (INSERT COIN)

On first launch you choose between two modes.

### 1. Full Mode: live YouTube search

Requires a free YouTube Data API key (about a minute to set up):

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project.
2. Enable **YouTube Data API v3**.
3. Go to **Credentials → Create credentials → API key**.
4. Paste the key into the boot screen.

**Quota:** the free tier gives 10,000 units/day. A search costs roughly 101 units, so you get about **100 searches per day**. Results are cached per query, so repeating a search is free.

### 2. Link Mode: no key needed

Choose **LINK MODE START**, then paste any `youtube.com/watch?v=…` URL into the search bar. Playing a link never touches the search API, so it doesn't use any quota.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` / `→` | Seek backward / forward |
| `N` / `P` | Next / previous track |
| `/` | Focus search |
| `Esc` | Close overlay or modal |

---

## Project Structure

```
music player proto/
├── index.html      # App shell: 3 screens, now-playing overlay, modals
├── styles.css      # Design system from DESIGN.md (CRT scanlines, pixel decks)
└── js/
    ├── store.js    # Favorites, playlists, recents, play counts, settings (localStorage)
    ├── player.js   # YouTube IFrame engine: queue, shuffle, loop, seek, media session
    ├── api.js      # Live search, link parsing, quota accounting
    └── ui.js       # Screens, VU meter, scrubber, queue, boot flow
```

| File | Role |
|---|---|
| `index.html` | App shell, three screens, now-playing overlay, modals |
| `styles.css` | Visual design system (see `DESIGN.md`) |
| `js/store.js` | Persistent data layer on top of `localStorage` |
| `js/player.js` | Wraps the YouTube IFrame player and exposes queue/transport controls |
| `js/api.js` | Search requests, URL parsing, and quota tracking |
| `js/ui.js` | Rendering, interaction, and the boot flow |

---

## Design & Implementation Notes

- **Hidden player uses `opacity: .01`, not `display: none`.** Browsers can pause or refuse to start media in fully hidden embeds. Keeping the player technically rendered lets audio survive the Now-Playing overlay closing.
- **Search results are cached per query** to stretch the daily API quota.
- **Quota accounting** is tracked client-side in `api.js` so you can see roughly how much of the day's budget remains.
- **Official embed only.** Audio is played through YouTube's own player, so no streams are extracted or downloaded.

---

## Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| Search stops working | Daily quota exhausted (resets daily). Use Link Mode in the meantime. |
| A track won't play | The uploader may have disabled embedding. Try another upload. |
| Audio won't start on load | Browsers block autoplay until a user interaction. Tap play once. |
| Blank or broken player when opened from disk | Serve over HTTP (see Quick Start) instead of `file://`. |
| Layout looks off | Switch to a mobile viewport in DevTools. |

---

## Privacy

PIXELBEAT has no backend. Your favorites, playlists, history, and settings stay in your browser's `localStorage`. Your API key, if you use Full Mode, is entered on the boot screen and is used only for requests to the YouTube Data API. Clearing site data resets everything.

---

## Terms & Attribution

Playback uses the official YouTube embedded player and is subject to the [YouTube Terms of Service](https://www.youtube.com/t/terms) and the [YouTube API Services Terms](https://developers.google.com/youtube/terms/api-services-terms-of-service). PIXELBEAT is not affiliated with or endorsed by YouTube or Google.

---

## License

Add your license here (e.g. MIT).
