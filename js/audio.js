(function () {
  'use strict';

  var audio = document.getElementById('site-audio');
  if (!audio) return;

  var started = false;

  function start() {
    if (started) return;
    started = true;
    var playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        started = false;
      });
    }
  }

  audio.addEventListener('playing', function () {
    started = true;
  });

  audio.addEventListener('canplaythrough', start, { once: true });
  audio.addEventListener('loadeddata', start, { once: true });

  document.addEventListener('pointerdown', start, { once: true, passive: true });
  document.addEventListener('keydown', start, { once: true });

  start();
})();