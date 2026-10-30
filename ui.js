/* PIXELBEAT — UI wiring: screens, player screens, search, library, boot */
window.PB = window.PB || {};
(function () {
  'use strict';

  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const fmt = function (s) {
    s = Math.max(0, Math.floor(s || 0));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };

  const els = {};
  ['app-header', 'sys-badge', 'btn-logo', 'btn-settings',
    'screen-home', 'screen-search', 'screen-library', 'main',
    'stat-plays', 'stat-favs', 'stat-quota', 'btn-hero-radio', 'btn-hero-search',
    'home-recents', 'home-recents-empty',
    'search-form', 'search-input', 'search-display', 'btn-clear', 'search-status',
    'search-results', 'search-empty', 'search-net', 'search-chips',
    'lib-count', 'lib-favs', 'lib-favs-empty', 'lib-most', 'lib-most-empty',
    'lib-playlists', 'lib-playlists-empty', 'pl-name', 'pl-create',
    'mini-player', 'mini-progress', 'mini-thumb', 'mini-title', 'mini-artist',
    'mini-open', 'mini-play', 'mini-play-icon', 'mini-next',
    'np', 'np-back', 'np-stash', 'np-heart', 'np-heart-icon', 'np-art',
    'np-art-wrap', 'np-title', 'np-artist', 'np-vu',
    'np-time-cur', 'np-time-dur', 'np-scrub', 'np-scrub-fill', 'np-scrub-thumb',
    'np-shuffle', 'np-loop', 'np-loop-lab', 'np-prev', 'np-play', 'np-play-icon',
    'np-next', 'np-video-toggle', 'np-vol', 'np-vol-lvl',
    'np-queue-head', 'np-queue', 'np-queue-count', 'np-queue-rows', 'np-queue-arrow',
    'modal-settings', 'set-close', 'set-key', 'set-save', 'set-quota', 'set-wipe',
    'modal-stash', 'stash-close', 'stash-list', 'stash-new-name', 'stash-create',
    'toast', 'toast-text',
    'boot', 'boot-start', 'boot-start-btn', 'boot-key-btn', 'boot-link-btn',
    'boot-key', 'key-input', 'key-submit', 'key-back',
    'yt-frame-wrap'
  ].forEach(function (id) { els[id] = $(id); });

  let screen = 'home';
  let toastTimer = null;
  let lastSearchResults = [];
  let vuPlaying = false;
  let scrubbing = false;
  const vuBars = [];
  const vuHeights = [];

  /* ================= BOOT ================= */
  document.addEventListener('DOMContentLoaded', function () {
    buildVU(); buildVol(); wireStatic();
    if (location.protocol === 'file:') {
      toast('SERVE VIA LOCALHOST — RUN: python3 -m http.server 8000', 'pink', 4200);
    }
    updateBadge(); renderAll(); refreshStats();
    PB.player.init();
    PB.player.CB.onTrack = onTrack;
    PB.player.CB.onState = onState;
    PB.player.CB.onTime = onTime;
    PB.player.CB.onVolume = renderVol;
    PB.player.CB.onShuffle = syncDeck;
    PB.player.CB.onLoop = syncDeck;
    PB.player.CB.onError = function (msg) { toast(msg, 'pink'); };
    PB.player.CB.onCount = function () { refreshStats(); if (screen === 'library') renderLib(); };
    if (PB.store.state.bootDone) hideBoot(true);
    els['np'].classList.add('no-track');
  });

  function hideBoot(silent) {
    els['boot'].classList.add('is-hidden');
    if (!silent) toast('SYSTEM ONLINE — COINS ACCEPTED');
  }

  function enterApp() {
    PB.store.state.bootDone = true;
    PB.store.persistState();
    hideBoot();
  }

  function updateBadge() {
    const hasKey = !!PB.store.state.apiKey;
    els['sys-badge'].textContent = hasKey ? 'SYS.ONLINE' : 'SYS.LITE';
    els['sys-badge'].classList.toggle('is-off', !hasKey);
  }

  /* ================= NAV / SCREENS ================= */
  function showScreen(name) {
    screen = name;
    ['home', 'search', 'library'].forEach(function (n) {
      els['screen-' + n].classList.toggle('is-active', n === name);
    });
    document.querySelectorAll('.dock-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.nav === name);
    });
    els['main'].scrollTop = 0;
    if (name === 'library') renderLib();
    if (name === 'home') { renderHome(); refreshStats(); }
  }

  /* ================= TOAST ================= */
  function toast(msg, kind, ms) {
    els['toast-text'].textContent = msg;
    els['toast'].classList.add('is-show');
    els['toast'].classList.toggle('is-pink', kind === 'pink');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els['toast'].classList.remove('is-show'); }, ms || 2400);
  }

  /* ================= ROW FACTORY ================= */
  function hydrate(t) { return Object.assign({}, PB.store.meta[t.id] || {}, t); }

  function makeRow(track, i, list) {
    track = hydrate(track);
    const cur = PB.player.current;
    const playing = !!cur && cur.id === track.id;
    const row = document.createElement('div');
    row.className = 'trow' + (playing ? ' is-playing' : '');
    row.innerHTML =
      (playing ? '<div class="t-eq"><i></i><i></i><i></i></div>'
               : '<div class="t-num">' + String(i + 1).padStart(2, '0') + '</div>') +
      '<img class="t-thumb" src="' + esc(track.thumb || PB.api.thumb(track.id, false)) + '" alt="" loading="lazy"/>' +
      '<div class="t-meta"><span class="t-title">' + esc(track.title) + '</span>' +
      '<span class="t-artist">' + esc(track.artist) + '</span></div>' +
      '<span class="t-dur">' + (track.duration ? fmt(track.duration) : '--:--') + '</span>';
    row.addEventListener('click', function () { PB.player.playQueue(list, i); });
    return row;
  }

  /* ================= SEARCH ================= */
  function setStatus(txt, cls) {
    els['search-status'].textContent = txt;
    els['search-status'].className = 'status-title' + (cls ? ' is-' + cls : '');
  }

  function syncDisplay() {
    const v = els['search-input'].value;
    els['search-display'].textContent = v || 'SEARCH_TRACKS_';
    els['search-display'].classList.toggle('is-placeholder', !v);
  }

  async function runSearch(q, thenPlayRadio) {
    q = (q || '').trim();
    if (!q) { toast('INSERT QUERY FIRST', 'pink'); return; }
    els['search-input'].value = q; syncDisplay();
    const parsed = PB.api.parseInput(q);

    /* pasted link → zero-API-key playback */
    if (parsed && parsed.kind === 'id') {
      const t = {
        id: parsed.id, title: 'YOUTUBE LINK', artist: 'LOADING DATA…',
        duration: 0, thumb: PB.api.thumb(parsed.id, false), bigThumb: PB.api.thumb(parsed.id, true), source: 'yt'
      };
      lastSearchResults = [t];
      setStatus('LINK MODE [ 1 FOUND ]');
      showResults();
      PB.player.playQueue(lastSearchResults, 0);
      openNP();
      return;
    }

    if (!PB.store.state.apiKey) {
      setStatus('NO KEY — INSERT API KEY', 'error');
      toast('ENTER FREE API KEY OR PASTE A YOUTUBE LINK', 'pink', 4000);
      return;
    }
    if (PB.store.quotaLeft() < 110) {
      setStatus('NO CREDITS — INSERT COIN', 'error');
      toast('DAILY QUOTA SPENT — LINK MODE STILL WORKS', 'pink', 4000);
      return;
    }

    setStatus('SCANNING GRID…', 'busy');
    els['search-empty'].hidden = true;
    elsvEmpty('search-results', true);
    try {
      const tracks = await PB.api.search(q);
      lastSearchResults = tracks;
      els['search-chips'].querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('is-on', c.dataset.q === q);
      });
      setStatus('TOP MATCHES [ ' + tracks.length + ' FOUND ]');
      els['search-net'].textContent = 'UNITS LEFT: ' + PB.store.quotaLeft();
      showResults();
      refreshStats();
      if (thenPlayRadio && tracks.length) {
        PB.player.playQueue(tracks, Math.floor(Math.random() * tracks.length));
      }
    } catch (e) {
      const msg = e.message || 'SEARCH FAILED';
      setStatus(msg, 'error');
      toast(msg, 'pink', 4000);
    }
  }

  function showResults() {
    const box = els['search-results'];
    box.innerHTML = '';
    els['search-empty'].hidden = lastSearchResults.length > 0;
    lastSearchResults.forEach(function (t, i) {
      box.appendChild(makeRow(t, i, lastSearchResults));
    });
  }
  function elsvEmpty(boxId, on) { els[boxId].innerHTML = ''; }

  /* ================= HOME ================= */
  function renderHome() {
    const box = els['home-recents'];
    const list = PB.store.rec.map(hydrate);
    box.innerHTML = '';
    els['home-recents-empty'].hidden = list.length > 0;
    list.forEach(function (t, i) { box.appendChild(makeRow(t, i, list)); });
  }

  function refreshStats() {
    els['stat-plays'].textContent = String(PB.store.totalPlays());
    els['stat-favs'].textContent = String(PB.store.favs.length);
    els['stat-quota'].textContent = PB.store.state.apiKey ? PB.store.quotaLeft() : 'LINK';
    els['lib-count'].textContent = PB.store.favs.length + ' SAVED';
    els['set-quota'].textContent = 'UNITS LEFT TODAY: ' + PB.store.quotaLeft() + ' / 10000';
  }

  /* ================= LIBRARY ================= */
  function renderLib() {
    renderFavs(); renderMost(); renderPlaylists(); refreshStats();
  }

  function renderFavs() {
    const box = els['lib-favs'];
    const list = PB.store.favs.map(hydrate);
    box.innerHTML = '';
    els['lib-favs-empty'].hidden = list.length > 0;
    list.forEach(function (t, i) { box.appendChild(makeRow(t, i, list)); });
  }

  function renderMost() {
    const box = els['lib-most'];
    const list = PB.store.topPlayed(10);
    box.innerHTML = '';
    els['lib-most-empty'].hidden = list.length > 0;
    list.forEach(function (t, i) {
      const row = makeRow(t, i, list);
      const badge = document.createElement('span');
      badge.className = 't-dur';
      badge.style.color = '#ff69b4';
      badge.textContent = '×' + t.count;
      row.appendChild(badge);
      box.appendChild(row);
    });
  }

  function renderPlaylists() {
    const box = els['lib-playlists'];
    const lists = PB.store.lists;
    box.innerHTML = '';
    els['lib-playlists-empty'].hidden = lists.length > 0;
    lists.forEach(function (l) {
      const row = document.createElement('div');
      row.className = 'pl-row';
      row.innerHTML =
        '<span class="pl-name">' + esc(l.name) + '</span>' +
        '<span class="pl-count">' + l.tracks.length + ' TRK</span>' +
        '<button class="pl-eject" title="Delete vault">▤</button>';
      row.addEventListener('click', function (e) {
        if (e.target.closest('.pl-eject')) return;
        if (!l.tracks.length) { toast(l.name + ' IS EMPTY — STASH TRACKS FIRST', 'pink'); return; }
        const tracks = l.tracks.map(hydrate);
        PB.player.playQueue(tracks, 0);
        toast('VAULT LOADED: ' + l.name);
        openNP();
      });
      row.querySelector('.pl-eject').addEventListener('click', function (e) {
        e.stopPropagation();
        PB.store.deletePlaylist(l.id);
        toast('VAULT EJECTED');
        renderLib(); renderStash();
      });
      box.appendChild(row);
    });
  }

  /* ================= NOW PLAYING ================= */
  function openNP() { els['np'].classList.add('is-open'); renderQueue(); renderVol(); syncDeck(); syncHeart(); }
  function closeNP() { els['np'].classList.remove('is-open'); els['yt-frame-wrap'].classList.remove('yt-visible'); }

  function onTrack(t) {
    document.title = (t.title + ' ▶ PIXELBEAT').toUpperCase();
    els['mini-title'].textContent = t.title;
    els['mini-artist'].textContent = t.artist;
    els['mini-thumb'].src = t.thumb || '';
    els['np-title'].textContent = t.title;
    els['np-artist'].textContent = t.artist;
    els['np-art'].src = t.bigThumb || t.thumb || '';
    els['mini-player'].classList.remove('is-hidden');
    els['np'].classList.remove('no-track');
    els['np'].classList.remove('is-video-mode');
    syncHeart(); renderQueue(); renderAll();
  }

  function onState(s) {
    const playing = s === 'playing';
    vuPlaying = playing;
    els['mini-play-icon'].textContent = playing ? 'pause' : 'play_arrow';
    els['np-play-icon'].textContent = playing ? 'pause' : 'play_arrow';
    renderAll();
  }

  function onTime(t, d) {
    const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;
    els['mini-progress'].style.width = pct + '%';
    els['np-scrub-fill'].style.width = pct + '%';
    els['np-scrub-thumb'].style.left = pct + '%';
    els['np-time-cur'].textContent = fmt(t);
    els['np-time-dur'].textContent = fmt(d);
  }

  function renderAll() {
    renderHome();
    showResults();
    if (screen === 'library') renderLib(); else { renderLib(); }
  }

  function syncHeart() {
    const cur = PB.player.current;
    const fav = !!cur && PB.store.isFav(cur.id);
    els['np-heart'].classList.toggle('is-fav', fav);
    els['np-heart-icon'].classList.toggle('ms-fill', fav);
  }

  function syncDeck() {
    els['np-shuffle'].classList.toggle('is-on', PB.store.state.shuffle);
    els['np-loop'].classList.toggle('is-on', PB.store.state.loop !== 'off');
    els['np-loop-lab'].textContent = PB.store.state.loop === 'one' ? '1' : PB.store.state.loop === 'off' ? '—' : 'ALL';
  }

  function renderQueue() {
    const q = PB.player.queue;
    els['np-queue-count'].textContent = String(q.length);
    const box = els['np-queue-rows'];
    box.innerHTML = '';
    if (!q.length) {
      box.innerHTML = '<div class="empty-state is-compact"><span class="empty-big">QUEUE EMPTY</span><span class="empty-sub">LOAD TRACKS FROM SEARCH OR VAULTS.</span></div>';
      return;
    }
    q.forEach(function (t, i) {
      const r = document.createElement('div');
      r.className = 'qrow' + (i === PB.player.index ? ' is-playing' : '');
      r.innerHTML =
        '<span class="t-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div class="t-meta"><span class="t-title">' + esc(t.title) + '</span>' +
        '<span class="t-artist">' + esc(t.artist) + '</span></div>' +
        '<span class="t-dur">' + (t.duration ? fmt(t.duration) : '--:--') + '</span>';
      r.addEventListener('click', function () { PB.player.jump(i); });
      box.appendChild(r);
    });
  }

  function renderVol() {
    const v = PB.store.state.volume;
    const blocks = els['np-vol'].children;
    for (let i = 0; i < blocks.length; i++) {
      blocks[i].classList.toggle('is-on', v >= (i + 1) * 10 - 4);
    }
    els['np-vol-lvl'].textContent = String(v);
  }

  /* ---------- VU meter (simulated — legal, since YT audio can't be tapped) ---------- */
  function buildVU() {
    const box = els['np-vu'];
    for (let i = 0; i < 20; i++) {
      const b = document.createElement('div');
      b.className = 'vu-bar';
      b.style.height = '12%';
      box.appendChild(b); vuBars.push(b); vuHeights.push(10 + Math.random() * 14);
    }
    setInterval(tickVU, 80);
  }
  function tickVU() {
    for (let i = 0; i < vuBars.length; i++) {
      let h;
      if (vuPlaying) {
        const target = 10 + Math.random() * 90;
        h = vuHeights[i] * 0.45 + target * 0.55;
      } else {
        h = Math.max(6, vuHeights[i] * 0.7);
      }
      vuHeights[i] = h;
      const c = Math.max(6, Math.min(100, h));
      vuBars[i].style.height = c + '%';
      vuBars[i].style.background = c > 86 ? '#ff4f93' : c > 70 ? '#33d4ff' : '#39ff6a';
    }
  }

  /* ---------- segmented volume ---------- */
  function buildVol() {
    for (let i = 0; i < 10; i++) {
      (function (idx) {
        const b = document.createElement('button');
        b.className = 'vol-block';
        b.setAttribute('aria-label', 'Volume ' + (idx + 1) * 10);
        b.addEventListener('click', function () { PB.player.setVolume((idx + 1) * 10); });
        els['np-vol'].appendChild(b);
      })(i);
    }
  }

  /* ---------- stash modal ---------- */
  let stashOpen = false;
  function renderStash() {
    const box = els['stash-list'];
    box.innerHTML = '';
    const lists = PB.store.lists;
    if (!lists.length) {
      box.innerHTML = '<div class="empty-state is-compact"><span class="empty-big">NO VAULTS YET</span><span class="empty-sub">CREATE ONE BELOW TO STASH THIS TRACK.</span></div>';
      return;
    }
    lists.forEach(function (l) {
      const row = document.createElement('div');
      row.className = 'pl-row';
      row.innerHTML =
        '<span class="pl-name">' + esc(l.name) + '</span>' +
        '<span class="pl-count">' + l.tracks.length + ' TRK</span>' +
        '<button class="pl-eject">+</button>';
      row.addEventListener('click', function () {
        const cur = PB.player.current;
        if (!cur) { toast('NO TRACK LOADED', 'pink'); return; }
        const res = PB.store.addToPlaylist(l.id, cur);
        if (res === 'OK') toast('STASHED → ' + l.name);
        else if (res === 'IN') toast('ALREADY IN ' + l.name, 'pink');
        renderStash(); renderLib();
      });
      box.appendChild(row);
    });
  }
  function openStash() {
    stashOpen = true;
    els['modal-stash'].classList.add('is-open');
    renderStash();
  }

  /* ================= STATIC EVENT WIRING ================= */
  function wireStatic() {
    /* nav */
    document.querySelectorAll('.dock-btn').forEach(function (b) {
      b.addEventListener('click', function () { showScreen(b.dataset.nav); });
    });
    els['btn-logo'].addEventListener('click', function () { showScreen('home'); });

    /* home */
    els['btn-hero-search'].addEventListener('click', function () {
      showScreen('search'); els['search-input'].focus();
    });
    els['btn-hero-radio'].addEventListener('click', function () {
      const presets = ['chiptune 8-bit mix', 'synthwave retrowave mix', 'arcade boss battle theme', 'lofi hip hop gaming mix'];
      const q = presets[Math.floor(Math.random() * presets.length)];
      runSearch(q, true);
    });
    document.querySelectorAll('.cartridge').forEach(function (c) {
      c.addEventListener('click', function () {
        showScreen('search');
        runSearch(c.dataset.q);
      });
    });

    /* search */
    els['search-form'].addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch(els['search-input'].value);
    });
    els['search-input'].addEventListener('input', syncDisplay);
    els['btn-clear'].addEventListener('click', function () {
      els['search-input'].value = ''; syncDisplay();
      els['search-input'].focus();
    });
    els['search-chips'].querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () { runSearch(c.dataset.q); });
    });

    /* mini player */
    els['mini-play'].addEventListener('click', function () { PB.player.toggle(); });
    els['mini-next'].addEventListener('click', function () { PB.player.next(false); });
    els['mini-open'].addEventListener('click', openNP);

    /* now playing */
    els['np-back'].addEventListener('click', closeNP);
    els['np-play'].addEventListener('click', function () { PB.player.toggle(); });
    els['np-next'].addEventListener('click', function () { PB.player.next(false); });
    els['np-prev'].addEventListener('click', function () { PB.player.prev(); });
    els['np-shuffle'].addEventListener('click', function () { PB.player.toggleShuffle(); });
    els['np-loop'].addEventListener('click', function () { PB.player.cycleLoop(); });
    els['np-heart'].addEventListener('click', function () {
      const cur = PB.player.current;
      if (!cur) { toast('NO TRACK LOADED', 'pink'); return; }
      const now = PB.store.toggleFav(cur);
      syncHeart(); renderAll();
      toast(now ? 'SAVED TO VAULT ♥' : 'REMOVED FROM VAULT');
    });
    els['np-stash'].addEventListener('click', openStash);
    els['np-video-toggle'].addEventListener('click', function () {
      const on = els['yt-frame-wrap'].classList.toggle('yt-visible');
      els['np-video-toggle'].classList.toggle('is-on', on);
      toast(on ? 'VIDEO FEED ON' : 'VIDEO FEED HIDDEN');
    });
    els['np-queue-head'].addEventListener('click', function () {
      const open = els['np-queue'].classList.toggle('is-open');
      els['np-queue-arrow'].textContent = open ? 'expand_more' : 'expand_less';
    });

    /* scrubber drag */
    els['np-scrub'].addEventListener('pointerdown', function (e) {
      scrubbing = true;
      try { els['np-scrub'].setPointerCapture(e.pointerId); } catch (err) { }
      seekFromScrub(e, true);
    });
    els['np-scrub'].addEventListener('pointermove', function (e) { if (scrubbing) seekFromScrub(e); });
    els['np-scrub'].addEventListener('pointerup', function (e) {
      if (scrubbing) seekFromScrub(e, true);
      scrubbing = false;
    });
    els['np-scrub'].addEventListener('pointercancel', function () { scrubbing = false; });

    /* library playlist creator */
    els['pl-create'].addEventListener('click', function () {
      const name = els['pl-name'].value.trim() || 'VAULT ' + (PB.store.lists.length + 1);
      PB.store.createPlaylist(name);
      els['pl-name'].value = '';
      toast('VAULT BUILT: ' + name.toUpperCase());
      renderLib();
    });

    /* stash modal */
    els['stash-close'].addEventListener('click', function () { els['modal-stash'].classList.remove('is-open'); });
    els['stash-create'].addEventListener('click', function () {
      const cur = PB.player.current;
      const name = els['stash-new-name'].value.trim() || 'VAULT ' + (PB.store.lists.length + 1);
      const l = PB.store.createPlaylist(name);
      if (cur) PB.store.addToPlaylist(l.id, cur);
      els['stash-new-name'].value = '';
      toast('VAULT BUILT — TRACK STASHED');
      renderStash(); renderLib();
    });

    /* settings modal */
    els['btn-settings'].addEventListener('click', function () {
      els['set-key'].value = PB.store.state.apiKey;
      refreshStats();
      els['modal-settings'].classList.add('is-open');
    });
    els['set-close'].addEventListener('click', function () { els['modal-settings'].classList.remove('is-open'); });
    els['set-save'].addEventListener('click', function () {
      PB.store.state.apiKey = els['set-key'].value.trim();
      PB.store.persistState();
      updateBadge(); refreshStats();
      els['modal-settings'].classList.remove('is-open');
      toast(PB.store.state.apiKey ? 'KEY SAVED — SYS.ONLINE' : 'KEY CLEARED — SYS.LITE');
    });
    els['set-wipe'].addEventListener('click', function () { PB.store.wipe(); });
    els['modal-settings'].addEventListener('click', function (e) {
      if (e.target === els['modal-settings']) els['modal-settings'].classList.remove('is-open');
    });
    els['modal-stash'].addEventListener('click', function (e) {
      if (e.target === els['modal-stash']) els['modal-stash'].classList.remove('is-open');
    });

    /* boot */
    els['boot-start-btn'].addEventListener('click', function () {
      if (PB.store.state.apiKey) enterApp();
      else toast('NO KEY LOADED — ENTER API KEY OR LINK MODE', 'pink', 3500);
    });
    els['boot-key-btn'].addEventListener('click', function () {
      els['boot-start'].hidden = true;
      els['boot-key'].hidden = false;
      els['key-input'].focus();
    });
    els['key-back'].addEventListener('click', function () {
      els['boot-key'].hidden = true;
      els['boot-start'].hidden = false;
    });
    els['key-submit'].addEventListener('click', async function () {
      const key = els['key-input'].value.trim();
      if (!key) { toast('PASTE A KEY FIRST', 'pink'); return; }
      els['key-submit'].textContent = 'VALIDATING…';
      try {
        await PB.api.validateKey(key);
        PB.store.state.apiKey = key;
        PB.store.persistState();
        updateBadge();
        enterApp();
        toast('API KEY ACCEPTED — SYS.ONLINE');
      } catch (e) {
        toast(e.message || 'KEY REJECTED — CHECK INPUT', 'pink', 4200);
      }
      els['key-submit'].textContent = 'VALIDATE + ENTER';
    });
    els['key-input'].addEventListener('keydown', function (e) {
      if (e.key === 'Enter') els['key-submit'].click();
    });
    els['boot-link-btn'].addEventListener('click', function () {
      enterApp();
      toast('LINK MODE — PASTE A YOUTUBE URL IN SEARCH', 'pink', 4200);
    });

    /* keyboard shortcuts */
    document.addEventListener('keydown', function (e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';
      if (e.key === 'Escape') {
        if (els['modal-settings'].classList.contains('is-open')) { els['modal-settings'].classList.remove('is-open'); return; }
        if (els['modal-stash'].classList.contains('is-open')) { els['modal-stash'].classList.remove('is-open'); return; }
        if (els['np'].classList.contains('is-open')) { closeNP(); return; }
        return;
      }
      if (typing) return;
      switch (e.key) {
        case ' ':
        case 'k': e.preventDefault(); PB.player.toggle(); break;
        case 'ArrowRight': PB.player.seekBy(10); break;
        case 'ArrowLeft': PB.player.seekBy(-10); break;
        case 'n': PB.player.next(false); break;
        case 'p': PB.player.prev(); break;
        case '/': e.preventDefault(); showScreen('search'); els['search-input'].focus(); break;
      }
    });
  }

  /* ---------- scrubber helper (throttled live-seek) ---------- */
  let lastSeekAt = 0;
  function seekFromScrub(e, force) {
    const rect = els['np-scrub'].getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    els['np-scrub-fill'].style.width = (pct * 100) + '%';
    els['np-scrub-thumb'].style.left = (pct * 100) + '%';
    const now = Date.now();
    if (force || now - lastSeekAt > 150) {
      lastSeekAt = now;
      const cur = PB.player.current;
      const dur = (cur && cur.duration) || 0;
      if (dur > 0) PB.player.seek(pct * dur);
    }
  }
})();
