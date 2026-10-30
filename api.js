/* PIXELBEAT — YouTube Data API v3 (free tier) + link parsing
   One search ≈ 100 units + 1 unit for durations · 10,000 free units/day */
window.PB = window.PB || {};

PB.api = (function () {
  const BASE = 'https://www.googleapis.com/youtube/v3';

  /* ---------- input parsing ---------- */
  function parseInput(text) {
    const s = String(text || '').trim();
    if (!s) return null;
    let m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m) return { kind: 'id', id: m[1] };
    m = s.match(/(?:v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    if (m) return { kind: 'id', id: m[1] };
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { kind: 'id', id: s };
    return { kind: 'query', q: s };
  }

  /* ---------- helpers ---------- */
  function parseISODur(iso) {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
    if (!m) return 0;
    return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
  }

  function splitTitle(raw, channel) {
    let t = String(raw || '')
      .replace(/[\(\[\{][^)\]\}]*(official|video|audio|mv|lyric|hd|hq)[^)\]\}]*[\)\]\}]/ig, '')
      .replace(/\s*[-–—|·]\s*/g, '|').trim();
    const parts = t.split('|').map(function (p) { return p.trim(); }).filter(Boolean);
    if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(' - ') };
    return { artist: (channel || 'UNKNOWN').trim(), title: t || 'UNTITLED' };
  }

  function thumb(id, big) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (big ? 'hqdefault' : 'mqdefault') + '.jpg';
  }

  /* ---------- error mapping ---------- */
  function apiError(status, data) {
    const e = new Error('API_ERROR');
    e.status = status;
    const err = (data && data.error) || {};
    const reason = (err.errors && err.errors[0] && err.errors[0].reason) || '';
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || status === 403) {
      e.code = 'QUOTA'; e.message = 'NO CREDITS — INSERT COIN';
    } else if (status === 400) {
      e.code = 'BAD_KEY'; e.message = 'KEY REJECTED BY ARCADE';
    } else {
      e.code = 'API'; e.message = 'GRID ERROR ' + status;
    }
    return e;
  }

  /* ---------- live search ---------- */
  async function search(query) {
    const key = PB.store.state.apiKey;
    if (!key) { const e = new Error('no key'); e.code = 'NO_API_KEY'; e.message = 'NO KEY — ENTER API KEY'; throw e; }

    const cached = PB.store.cacheGet(query);
    if (cached) return cached;

    const u = new URL(BASE + '/search');
    u.searchParams.set('part', 'snippet');
    u.searchParams.set('type', 'video');
    u.searchParams.set('videoCategoryId', '10');   // Music
    u.searchParams.set('videoEmbeddable', 'true'); // avoid non-embeddable tracks
    u.searchParams.set('maxResults', '25');
    u.searchParams.set('q', query);
    u.searchParams.set('key', key);

    let res;
    try { res = await fetch(u); }
    catch (err) { const e = new Error('off'); e.code = 'NETWORK'; e.message = 'GRID OFFLINE — CHECK NET'; throw e; }

    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw apiError(res.status, data);

    const hits = (data.items || []).filter(function (it) { return it.id && it.id.videoId; });
    PB.store.spend(100);
    if (!hits.length) return [];

    /* durations + exact titles in one batched, cheap call (~1 unit) */
    const ids = hits.map(function (h) { return h.id.videoId; }).join(',');
    const dmap = {};
    const tmap = {};
    try {
      const u2 = new URL(BASE + '/videos');
      u2.searchParams.set('part', 'contentDetails,snippet');
      u2.searchParams.set('id', ids);
      u2.searchParams.set('maxResults', '25');
      u2.searchParams.set('key', key);
      const r2 = await fetch(u2);
      if (r2.ok) {
        const d2 = await r2.json();
        (d2.items || []).forEach(function (v) {
          dmap[v.id] = v.contentDetails ? parseISODur(v.contentDetails.duration) : 0;
          tmap[v.id] = v.snippet || {};
        });
        PB.store.spend(1);
      }
    } catch (e) { /* durations are optional */ }

    const tracks = hits.slice(0, 25).map(function (h) {
      const id = h.id.videoId;
      const sn = tmap[id] || h.snippet || {};
      const st = splitTitle(sn.title || h.snippet.title, sn.channelTitle || h.snippet.channelTitle);
      return {
        id: id,
        title: st.title.toUpperCase().slice(0, 64),
        artist: st.artist.toUpperCase().slice(0, 48),
        duration: dmap[id] || 0,
        thumb: thumb(id, false),
        bigThumb: thumb(id, true),
        source: 'yt'
      };
    });
    PB.store.cacheSet(query, tracks);
    return tracks;
  }

  /* ---------- validate a key with a single cheap call (1 unit) ---------- */
  async function validateKey(key) {
    const u = new URL(BASE + '/videos');
    u.searchParams.set('part', 'id');
    u.searchParams.set('chart', 'mostPopular');
    u.searchParams.set('maxResults', '1');
    u.searchParams.set('key', key);
    let res;
    try { res = await fetch(u); }
    catch (err) { const e = new Error('off'); e.code = 'NETWORK'; e.message = 'GRID OFFLINE — CHECK NET'; throw e; }
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw apiError(res.status, data);
    PB.store.spend(1);
    return true;
  }

  return { parseInput, search, validateKey, thumb, splitTitle, parseISODur };
})();
