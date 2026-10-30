/* PIXELBEAT — localStorage persistence layer (no accounts, all local) */
window.PB = window.PB || {};

PB.store = (function () {
  const K = {
    state: 'pb_state_v1',
    favs: 'pb_favorites_v1',
    rec: 'pb_recents_v1',
    meta: 'pb_trackmeta_v1',
    cnt: 'pb_counts_v1',
    pl: 'pb_playlists_v1',
    cache: 'pb_cache_v1'
  };

  function load(key, def) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : def; }
    catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage full */ }
  }

  const state = Object.assign({
    apiKey: '',
    volume: 90,
    shuffle: false,
    loop: 'all',            // 'off' | 'all' | 'one'
    quotaDate: '',
    quotaUsed: 0,
    bootDone: false
  }, load(K.state, {}));

  const favs = load(K.favs, []);    // [track]
  const rec = load(K.rec, []);      // [track] newest first
  const meta = load(K.meta, {});    // id -> {id,title,artist,duration,thumb}
  const cnt = load(K.cnt, {});      // id -> play count
  const lists = load(K.pl, []);     // [{id,name,tracks:[track]}]
  let cache = load(K.cache, {});    // query -> {ts, tracks}

  function persistState() { save(K.state, state); }

  /* ---------- track meta (what "most played" reads) ---------- */
  function remember(track) {
    if (!track || !track.id) return;
    meta[track.id] = {
      id: track.id,
      title: track.title || 'UNTITLED',
      artist: track.artist || 'UNKNOWN',
      duration: track.duration || 0,
      thumb: track.thumb || '',
      bigThumb: track.bigThumb || track.thumb || ''
    };
    save(K.meta, meta);
  }

  /* ---------- favorites ---------- */
  function isFav(id) { return favs.some(t => t.id === id); }
  function toggleFav(track) {
    const i = favs.findIndex(t => t.id === track.id);
    if (i >= 0) favs.splice(i, 1);
    else { favs.unshift(track); remember(track); }
    save(K.favs, favs);
    return i < 0; // true = now fav
  }

  /* ---------- recents ---------- */
  function pushRecent(track) {
    remember(track);
    const i = rec.findIndex(t => t.id === track.id);
    if (i >= 0) rec.splice(i, 1);
    rec.unshift(track);
    if (rec.length > 12) rec.length = 12;
    save(K.rec, rec);
  }

  /* ---------- play counts ---------- */
  function bumpCount(track) {
    if (!track || !track.id) return;
    cnt[track.id] = (cnt[track.id] || 0) + 1;
    remember(track);
    save(K.cnt, cnt);
  }
  function playCount(id) { return cnt[id] || 0; }
  function totalPlays() { return Object.values(cnt).reduce((a, b) => a + b, 0); }
  function topPlayed(n) {
    return Object.keys(cnt)
      .map(id => Object.assign({ count: cnt[id] }, meta[id]))
      .filter(t => t.title)
      .sort((a, b) => b.count - a.count)
      .slice(0, n || 10)
      .map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, thumb: t.thumb, bigThumb: t.bigThumb, source: 'yt', count: t.count }));
  }

  /* ---------- playlists ---------- */
  function createPlaylist(name) {
    const l = { id: 'pl_' + Date.now(), name: String(name || 'VAULT').toUpperCase().slice(0, 24), tracks: [] };
    lists.unshift(l); save(K.pl, lists); return l;
  }
  function deletePlaylist(id) {
    const i = lists.findIndex(l => l.id === id);
    if (i >= 0) { lists.splice(i, 1); save(K.pl, lists); }
  }
  function addToPlaylist(pid, track) {
    const l = lists.find(l => l.id === pid);
    if (!l) return 'ERR';
    if (l.tracks.some(t => t.id === track.id)) return 'IN';
    l.tracks.push(track); remember(track); save(K.pl, lists); return 'OK';
  }

  /* ---------- search cache (saves quota on repeat searches) ---------- */
  function cacheGet(q) { const hit = cache[q]; return hit ? hit.tracks : null; }
  function cacheSet(q, tracks) {
    const keys = Object.keys(cache);
    if (keys.length >= 25) delete cache[keys[0]];
    cache[q] = { ts: Date.now(), tracks: tracks };
    save(K.cache, cache);
  }

  /* ---------- quota accounting (10,000 free units/day) ---------- */
  function today() { return new Date().toISOString().slice(0, 10); }
  function spend(n) {
    const t = today();
    if (state.quotaDate !== t) { state.quotaDate = t; state.quotaUsed = 0; }
    state.quotaUsed += n;
    persistState();
  }
  function quotaLeft() {
    const used = state.quotaDate === today() ? state.quotaUsed : 0;
    return Math.max(0, 10000 - used);
  }

  function wipe() {
    Object.values(K).forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  return {
    state, persistState, favs, rec, lists, meta,
    remember, isFav, toggleFav, pushRecent,
    bumpCount, playCount, totalPlays, topPlayed,
    createPlaylist, deletePlaylist, addToPlaylist,
    cacheGet, cacheSet, spend, quotaLeft, wipe
  };
})();
