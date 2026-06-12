(function () {
  'use strict';

  var iframe = document.getElementById('sc-player');
  if (!iframe) return;

  var TRACK =
    'https://soundcloud.com/barefaith/end-of-part-iii-intermedium-i';

  function boot() {
    if (typeof SC === 'undefined' || !SC.Widget) {
      setTimeout(boot, 50);
      return;
    }

    var widget = SC.Widget(iframe);
    var playing = false;

    function start() {
      if (playing) return;
      widget.play();
      playing = true;
    }

    widget.bind(SC.Widget.Events.READY, start);
    widget.bind(SC.Widget.Events.PLAY, function () {
      playing = true;
    });

    widget.bind(SC.Widget.Events.ERROR, function () {
      widget.load(TRACK, { auto_play: true, callback: start });
    });

    function unlock() {
      start();
    }

    document.addEventListener('pointerdown', unlock, { once: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();