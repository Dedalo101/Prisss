(function () {
  'use strict';

  var MIXCLOUD_API = 'https://widget.mixcloud.com/media/js/widgetApi.js';
  var apiLoading = false;
  var mixWidgets = new WeakMap();
  var activeIframe = null;

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

  function storeIframeSrc(iframe) {
    if (!iframe.dataset.embedSrc) {
      iframe.dataset.embedSrc = iframe.getAttribute('src') || '';
    }
  }

  function pauseMixcloud(iframe) {
    var widget = mixWidgets.get(iframe);
    if (widget && typeof widget.pause === 'function') {
      widget.pause().catch(function () {});
    }
  }

  function pauseHearthis(iframe) {
    storeIframeSrc(iframe);
    iframe.src = 'about:blank';
  }

  function restoreHearthis(iframe) {
    if (!iframe.dataset.embedSrc) return;
    if (iframe.getAttribute('src') !== 'about:blank') return;
    iframe.src = iframe.dataset.embedSrc;
  }

  function pauseEmbed(iframe) {
    if (!iframe) return;
    if (iframe.classList.contains('mix-frame')) {
      pauseMixcloud(iframe);
      return;
    }
    if (iframe.classList.contains('set-frame')) {
      pauseHearthis(iframe);
    }
  }

  function pauseOtherEmbeds(current) {
    Array.from(document.querySelectorAll('.mix-frame, .set-frame')).forEach(function (iframe) {
      if (iframe !== current) pauseEmbed(iframe);
    });
  }

  function onEmbedPlay(iframe) {
    pauseAmbient();
    pauseOtherEmbeds(iframe);
    activeIframe = iframe;
  }

  function bindIframeFocus() {
    window.addEventListener('blur', function () {
      setTimeout(function () {
        var active = document.activeElement;
        if (!isEmbedIframe(active)) return;
        onEmbedPlay(active);
      }, 0);
    });
  }

  function bindPostMessage() {
    window.addEventListener('message', function (event) {
      if (!/mixcloud\.com|hearthis\.at/i.test(event.origin || '')) return;
      if (!isPlayMessage(event.data)) return;

      var iframe = Array.from(document.querySelectorAll('.mix-frame, .set-frame')).find(function (frame) {
        return frame.contentWindow === event.source;
      });

      onEmbedPlay(iframe || activeIframe);
    });
  }

  function bindHearthisFrames(iframes) {
    iframes.forEach(function (iframe) {
      if (iframe.dataset.embedAudioBound === '1') return;
      iframe.dataset.embedAudioBound = '1';
      storeIframeSrc(iframe);

      iframe.addEventListener('mouseenter', function () {
        restoreHearthis(iframe);
      }, { passive: true });

      iframe.addEventListener('focus', function () {
        restoreHearthis(iframe);
      });
    });
  }

  function bindMixcloudIframe(iframe) {
    if (iframe.dataset.embedAudioBound === '1') return;
    iframe.dataset.embedAudioBound = '1';

    try {
      var widget = Mixcloud.PlayerWidget(iframe);
      mixWidgets.set(iframe, widget);
      widget.ready.then(function () {
        widget.events.play.on(function () {
          onEmbedPlay(iframe);
        });
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

    var mixFrames = Array.from(document.querySelectorAll('.mix-frame'));
    var setFrames = Array.from(document.querySelectorAll('.set-frame'));

    bindMixcloud(mixFrames);
    bindHearthisFrames(setFrames);
  }

  window.initPrisssEmbedAudio = init;
  window.PRISSS_EMBED_AUDIO_BOOT = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();