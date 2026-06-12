(function () {
  'use strict';

  var MIXCLOUD_API = 'https://widget.mixcloud.com/media/js/widgetApi.js';
  var apiLoading = false;

  function pauseAmbient() {
    if (window.PRISSS_AUDIO && typeof window.PRISSS_AUDIO.pauseForEmbed === 'function') {
      window.PRISSS_AUDIO.pauseForEmbed();
      return;
    }
    var audio = document.getElementById('site-audio');
    if (audio) audio.pause();
  }

  function isEmbedIframe(el) {
    if (!el || el.tagName !== 'IFRAME') return false;
    var src = el.getAttribute('src') || '';
    return src.indexOf('mixcloud.com') !== -1 || src.indexOf('hearthis.at') !== -1;
  }

  function isPlayMessage(data) {
    if (!data) return false;
    if (typeof data === 'string') {
      return data === 'play' || data === 'playing' || /"event":"play"/.test(data);
    }
    if (typeof data !== 'object') return false;
    var type = data.type || data.event || data.method || data.name || '';
    if (type === 'play' || type === 'playing') return true;
    return data.playing === true;
  }

  function bindIframeFocus() {
    window.addEventListener('blur', function () {
      setTimeout(function () {
        if (isEmbedIframe(document.activeElement)) pauseAmbient();
      }, 0);
    });
  }

  function bindPostMessage() {
    window.addEventListener('message', function (event) {
      if (!/mixcloud\.com|hearthis\.at/i.test(event.origin || '')) return;
      if (isPlayMessage(event.data)) pauseAmbient();
    });
  }

  function bindMixcloudIframe(iframe) {
    if (iframe.dataset.embedAudioBound === '1') return;
    iframe.dataset.embedAudioBound = '1';

    try {
      var widget = Mixcloud.PlayerWidget(iframe);
      widget.ready.then(function () {
        widget.events.play.on(pauseAmbient);
      });
    } catch (_err) {
      /* keep iframe-focus fallback */
    }
  }

  function bindMixcloud(iframes) {
    if (!iframes.length) return;

    if (window.Mixcloud) {
      iframes.forEach(bindMixcloudIframe);
      return;
    }

    if (apiLoading) return;
    apiLoading = true;

    var script = document.createElement('script');
    script.src = MIXCLOUD_API;
    script.onload = function () {
      iframes.forEach(bindMixcloudIframe);
    };
    document.head.appendChild(script);
  }

  function init() {
    if (!window.PRISSS_EMBED_AUDIO_INIT) {
      window.PRISSS_EMBED_AUDIO_INIT = true;
      bindIframeFocus();
      bindPostMessage();
    }
    bindMixcloud(Array.from(document.querySelectorAll('.mix-frame')));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();