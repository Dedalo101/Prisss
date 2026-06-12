(function () {
  'use strict';

  var audio = document.getElementById('site-audio');
  if (!audio) return;

  var STORAGE_KEY = 'prisss-audio';
  var started = false;
  var restored = false;

  function readState() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    } catch (_err) {
      return null;
    }
  }

  function writeState() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        time: audio.currentTime || 0,
        playing: !audio.paused,
        unlocked: started,
      })
    );
  }

  function restorePosition() {
    if (restored) return;
    var state = readState();
    if (!state) return;
    if (state.unlocked) started = true;
    if (state.time > 0 && isFinite(state.time)) {
      audio.currentTime = state.time;
    }
    restored = true;
    if (state.playing) start();
  }

  function start() {
    if (started && !audio.paused) return;
    started = true;
    var playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        if (audio.currentTime === 0) started = false;
      });
    }
    writeState();
  }

  audio.addEventListener('playing', function () {
    started = true;
    writeState();
  });

  audio.addEventListener('timeupdate', function () {
    if (!audio.paused) writeState();
  });

  audio.addEventListener('loadedmetadata', restorePosition);
  audio.addEventListener('canplay', restorePosition);

  window.addEventListener('pagehide', writeState);
  window.addEventListener('beforeunload', writeState);

  document.addEventListener('pointerdown', start, { once: true, passive: true });
  document.addEventListener('keydown', start, { once: true });

  var state = readState();
  if (state && state.unlocked) {
    start();
  } else {
    audio.addEventListener('canplaythrough', start, { once: true });
    audio.addEventListener('loadeddata', start, { once: true });
    start();
  }
})();