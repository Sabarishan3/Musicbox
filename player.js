/* PIXELBEAT — YouTube IFrame player engine
   queue · shuffle · loop · seek · volume · media-session */
window.PB = window.PB || {};

PB.player = (function () {
  let yt = null;
  let ready = false;
  let apiPending = false;
  let pendingLoad = null;     // track queued before onReady fires

  let current = null;         // current track object
  const queue = [];           // play order
  let qIdx = -1;
  let original = [];          // pre-shuffle snapshot

  let pollTimer = null;
  let bumped = false;         // 30%-listened count bump done

  const CB = {                // UI callbacks
    onTrack: null,            //(track)
    onState: null,            //('playing'|'paused'|'buffering'|'error'|'end-of-queue')
    onTime: null,             //(sec, dur)
    onVolume: null,           //(v)
    onShuffle: null,          //(bool)
    onLoop: null,             //(mode)
    onError: null,            //(msg)
    onCount: null             //()
  };

  /* ---------- bootstrap ---------- */
  function ensureAPI(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) prev();
      cb();
    };
    if (!apiPending) {
      apiPending = true;
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  function init() {
    ensureAPI(function () {
      yt = new YT.Player('yt-embed', {
        width: '480', height: '270',
        playerVars: {
          autoplay: 0, controls: 0, rel: 0, fs: 0, disablekb: 1,
          iv_load_policy: 3, playsinline: 1, origin: location.origin
        },
        events: {
          onReady: function () {
            ready = true;
            yt.setVolume(PB.store.state.volume);
            if (pendingLoad) {
              const p = pendingLoad; pendingLoad = null;
              _load(p.track, p.autoplay);
            }
          },
          onStateChange: _onState,
          onError: _onError
        }
      });
    });
  }

  /* ---------- loading ---------- */
  function playQueue(list, startIdx) {
    if (!list || !list.length) { CB.onError && CB.onError('EMPTY QUEUE — LOAD TRACKS FIRST'); return; }
    queue.length = 0;
    list.forEach(function (t) { queue.push(t); });
    original = queue.slice();
    _shuffleInPlaceIfNeeded(startIdx || 0);
    _load(queue[qIdx], true);
  }

  function _shuffleInPlaceIfNeeded(startIdx) {
    if (PB.store.state.shuffle && queue.length > 1) {
      const head = queue[startIdx] || queue[0];
      const rest = queue.filter(function (t, i) { return i !== startIdx; });
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = rest[i]; rest[i] = rest[j]; rest[j] = tmp;
      }
      queue.length = 0;
      queue.push(head);
      rest.forEach(function (t) { queue.push(t); });
      qIdx = 0;
    } else {
      qIdx = startIdx || 0;
    }
  }

  function _load(track, autoplay) {
    current = track;
    qIdx = queue.indexOf(track);
    bumped = false;
    PB.store.pushRecent(track);
    stopPoll();
    CB.onTrack && CB.onTrack(track);
    if (!ready) { pendingLoad = { track: track, autoplay: autoplay !== false }; return; }
    if (autoplay === false) yt.cueVideoById(track.id);
    else yt.loadVideoById(track.id);
    _mediaSession(track);
  }

  function _onState(e) {
    const S = window.YT.PlayerState;
    if (e.data === S.PLAYING) {
      startPoll();
      const d = yt.getDuration();
      if (d && current && !current.duration) {
        current.duration = Math.round(d);
        PB.store.remember(current);
        CB.onTrack && CB.onTrack(current);   // re-render with real duration
      }
      /* hydrate pasted-link tracks with the real title/artist */
      if (current && current.title === 'YOUTUBE LINK' && window.PB.api) {
        try {
          const vd = yt.getVideoData();
          if (vd && vd.title) {
            const st = window.PB.api.splitTitle(vd.title, vd.author);
            current.title = String(st.title).toUpperCase().slice(0, 64);
            current.artist = String(st.artist).toUpperCase().slice(0, 48);
            current.hydrated = true;
            PB.store.remember(current);
            CB.onTrack && CB.onTrack(current);
          }
        } catch (err) { /* metadata not ready yet */ }
      }
      CB.onState && CB.onState('playing');
      if (navigator.mediaSession) navigator.mediaSession.playbackState = 'playing';
    } else if (e.data === S.PAUSED) {
      stopPoll();
      CB.onState && CB.onState('paused');
      if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
    } else if (e.data === S.BUFFERING) {
      CB.onState && CB.onState('buffering');
    } else if (e.data === S.ENDED) {
      _ended();
    }
  }

  function _ended() {
    stopPoll();
    if (PB.store.state.loop === 'one' && current) { seek(0); play(); return; }
    next(true);
  }

  function _onError(e) {
    let msg = 'TRACK CORRUPTED — SKIPPING';
    if (e && (e.data === 101 || e.data === 150)) msg = 'EMBED BLOCKED — SKIPPING TRACK';
    else if (e && e.data === 2) msg = 'INVALID TRACK ID';
    CB.onError && CB.onError(msg);
    if (queue.length > 1) setTimeout(function () { next(true); }, 500);
    else CB.onState && CB.onState('error');
  }

  /* ---------- progress polling ---------- */
  function startPoll() {
    stopPoll();
    pollTimer = setInterval(function () {
      if (!yt || !yt.getCurrentTime) return;
      const t = yt.getCurrentTime() || 0;
      const d = (current && current.duration) || 0;
      if (d > 0 && !bumped && current && t / d > 0.3) {
        bumped = true;
        PB.store.bumpCount(current);
        CB.onCount && CB.onCount();
      }
      CB.onTime && CB.onTime(t, d);
    }, 250);
  }
  function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  /* ---------- transport ---------- */
  function play() { if (ready && yt.playVideo) yt.playVideo(); }
  function pause() { if (ready && yt.pauseVideo) yt.pauseVideo(); }
  function toggle() {
    if (!ready) return;
    if (yt.getPlayerState() === window.YT.PlayerState.PLAYING) yt.pauseVideo();
    else yt.playVideo();
  }
  function seek(t) {
    if (!ready) return;
    yt.seekTo(Math.max(0, t), true);
    CB.onTime && CB.onTime(t, (current && current.duration) || 0);
  }
  function seekBy(d) { seek(((current && getTime()) || 0) + d); }

  function next(auto) {
    if (!queue.length) return;
    let i = qIdx + 1;
    if (i >= queue.length) {
      if (PB.store.state.loop === 'off' && auto) {
        CB.onState && CB.onState('end-of-queue');
        return;                              // let the last track sit
      }
      i = 0;
    }
    _load(queue[i], true);
  }
  function prev() {
    if (!queue.length) return;
    if (ready && yt.getCurrentTime && yt.getCurrentTime() > 4) { seek(0); return; }
    let i = qIdx - 1; if (i < 0) i = queue.length - 1;
    _load(queue[i], true);
  }
  function jump(i) { if (queue[i]) _load(queue[i], true); }

  /* ---------- shuffle / loop ---------- */
  function toggleShuffle() {
    const on = !PB.store.state.shuffle;
    PB.store.state.shuffle = on; PB.store.persistState();
    if (queue.length) {
      const cur = queue[qIdx];
      if (on) {
        const rest = queue.filter(function (t) { return t !== cur; });
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = rest[i]; rest[i] = rest[j]; rest[j] = tmp;
        }
        queue.length = 0; queue.push(cur);
        rest.forEach(function (t) { queue.push(t); });
        qIdx = 0;
      } else {
        queue.length = 0; original.forEach(function (t) { queue.push(t); });
        qIdx = Math.max(0, queue.indexOf(cur));
      }
    }
    CB.onShuffle && CB.onShuffle(on);
    return on;
  }
  function cycleLoop() {
    const order = ['all', 'one', 'off'];
    const i = order.indexOf(PB.store.state.loop);
    PB.store.state.loop = order[(i + 1) % order.length];
    PB.store.persistState();
    CB.onLoop && CB.onLoop(PB.store.state.loop);
    return PB.store.state.loop;
  }

  /* ---------- volume ---------- */
  function setVolume(v) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    PB.store.state.volume = v; PB.store.persistState();
    if (ready && yt.setVolume) yt.setVolume(v);
    CB.onVolume && CB.onVolume(v);
  }

  /* ---------- state getters ---------- */
  function getTime() { return ready && yt.getCurrentTime ? (yt.getCurrentTime() || 0) : 0; }
  function isPlaying() { return ready && yt.getPlayerState ? yt.getPlayerState() === window.YT.PlayerState.PLAYING : false; }
  function isEnded() { return ready && yt.getPlayerState ? yt.getPlayerState() === window.YT.PlayerState.ENDED : false; }

  /* ---------- media session (lockscreen / media keys) ---------- */
  function _mediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title || 'UNTITLED',
        artist: track.artist || 'UNKNOWN',
        album: 'PIXELBEAT',
        artwork: [{ src: (track.bigThumb || track.thumb || '').replace(/^http:/, 'https:'), sizes: '480x360', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', function () { play(); });
      navigator.mediaSession.setActionHandler('pause', function () { pause(); });
      navigator.mediaSession.setActionHandler('nexttrack', function () { next(false); });
      navigator.mediaSession.setActionHandler('previoustrack', function () { prev(); });
    } catch (e) { /* ignore */ }
  }

  return {
    init: init, playQueue: playQueue,
    play: play, pause: pause, toggle: toggle,
    seek: seek, seekBy: seekBy, next: next, prev: prev, jump: jump,
    toggleShuffle: toggleShuffle, cycleLoop: cycleLoop,
    setVolume: setVolume,
    isPlaying: isPlaying, isEnded: isEnded, getTime: getTime,
    get currentTime() { return getTime(); },
    get queue() { return queue; },
    get index() { return qIdx; },
    get current() { return current; },
    CB: CB
  };
})();
