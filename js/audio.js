(function () {
  'use strict';

  var audio = document.getElementById('site-audio');
  if (!audio) return;

  var STORAGE_KEY = 'prisss-audio';
  var started = false;
  var restored = false;
  var pausedByEmbed = false;
  var userPaused = false;
  var pauseBtn = null;

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
        playing: !audio.paused && !userPaused,
        unlocked: started,
        userPaused: userPaused,
      })
    );
  }

  function updatePauseButton() {
    if (!pauseBtn) return;
    var playing = !audio.paused && !userPaused;
    pauseBtn.classList.toggle('is-playing', !playing);
    pauseBtn.setAttribute('aria-label', playing ? 'Pause ambient music' : 'Play ambient music');
    pauseBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  function ensurePauseButton() {
    if (pauseBtn && pauseBtn.isConnected) return pauseBtn;

    var existing = document.getElementById('audio-pause-btn');
    if (existing) {
      pauseBtn = existing;
      return pauseBtn;
    }

    pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.id = 'audio-pause-btn';
    pauseBtn.className = 'audio-pause-btn';
    pauseBtn.innerHTML =
      '<span class="audio-pause-btn__bar" aria-hidden="true"></span>' +
      '<span class="audio-pause-btn__bar" aria-hidden="true"></span>' +
      '<span class="audio-pause-btn__play" aria-hidden="true"></span>';

    pauseBtn.addEventListener('click', function () {
      if (!userPaused && !audio.paused) {
        userPaused = true;
        pausedByEmbed = false;
        audio.pause();
      } else {
        userPaused = false;
        pausedByEmbed = false;
        started = true;
        var attempt = audio.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(function () {});
        }
      }
      writeState();
      updatePauseButton();
    });

    document.body.appendChild(pauseBtn);
    updatePauseButton();
    return pauseBtn;
  }

  function restorePosition() {
    if (restored) return;
    var state = readState();
    if (!state) return;
    if (state.unlocked) started = true;
    if (state.userPaused) userPaused = true;
    if (state.time > 0 && isFinite(state.time)) {
      audio.currentTime = state.time;
    }
    restored = true;
    if (state.playing && !userPaused) start();
    updatePauseButton();
  }

  function pauseForEmbed() {
    pausedByEmbed = true;
    started = true;
    audio.pause();
    writeState();
    updatePauseButton();
  }

  function resumeIfPlaying() {
    if (pausedByEmbed || userPaused) return;
    var state = readState();
    if (state && state.playing && audio.paused) {
      var attempt = audio.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }
    updatePauseButton();
  }

  function start() {
    if (pausedByEmbed || userPaused) return;
    if (started && !audio.paused) return;
    started = true;
    var playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        if (audio.currentTime === 0) started = false;
      });
    }
    writeState();
    updatePauseButton();
  }

  audio.addEventListener('playing', function () {
    started = true;
    writeState();
    updatePauseButton();
  });

  audio.addEventListener('pause', function () {
    writeState();
    updatePauseButton();
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

  window.PRISSS_AUDIO = {
    pauseForEmbed: pauseForEmbed,
    resumeIfPlaying: resumeIfPlaying,
    isPausedByEmbed: function () {
      return pausedByEmbed;
    },
    ensurePauseButton: ensurePauseButton,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensurePauseButton, { once: true });
  } else {
    ensurePauseButton();
  }

  var state = readState();
  if (state && state.unlocked && !state.userPaused) {
    start();
  } else {
    audio.addEventListener('canplaythrough', start, { once: true });
    audio.addEventListener('loadeddata', start, { once: true });
    if (!state || !state.userPaused) start();
  }
})();