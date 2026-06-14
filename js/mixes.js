(function () {
  'use strict';

  function embedSrc(showUrl) {
    return (
      'https://www.mixcloud.com/widget/iframe/?feed=' +
      encodeURIComponent(showUrl) +
      '&hide_cover=0&hide_artwork=0&light=0'
    );
  }

  function renderShows() {
    var root = document.getElementById('mixes-list');
    if (!root || typeof PRISSS_SHOWS === 'undefined') return;

    var frag = document.createDocumentFragment();

    PRISSS_SHOWS.forEach(function (show) {
      var card = document.createElement('article');
      card.className = 'mix-card';

      var media = document.createElement('div');
      media.className = 'mix-media';

      if (show.image) {
        var artLink = document.createElement('a');
        artLink.className = 'mix-art-link';
        artLink.href = show.url;
        artLink.target = '_blank';
        artLink.rel = 'noopener noreferrer';
        artLink.setAttribute('aria-label', show.title + ' on Mixcloud');

        var art = document.createElement('img');
        art.className = 'mix-art';
        art.src = show.image;
        art.alt = '';
        art.width = 120;
        art.height = 120;
        art.loading = 'lazy';
        art.decoding = 'async';

        artLink.appendChild(art);
        media.appendChild(artLink);
      }

      var body = document.createElement('div');
      body.className = 'mix-body';

      var title = document.createElement('h2');
      title.className = 'mix-title';

      var titleLink = document.createElement('a');
      titleLink.href = show.url;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.textContent = show.title;
      title.appendChild(titleLink);

      var iframe = document.createElement('iframe');
      iframe.className = 'mix-frame';
      iframe.loading = 'lazy';
      iframe.allow =
        'encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share';
      iframe.src = embedSrc(show.url);
      iframe.title = show.title + ' — Mixcloud player';

      body.appendChild(title);
      body.appendChild(iframe);
      media.appendChild(body);
      card.appendChild(media);
      frag.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(frag);

    if (window.PRISSS_EMBED_AUDIO_INIT && typeof window.initPrisssEmbedAudio === 'function') {
      window.initPrisssEmbedAudio();
    }
  }

  window.PRISSS_MIXES_RENDER = renderShows;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderShows);
  } else {
    renderShows();
  }
})();