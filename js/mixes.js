(function () {
  'use strict';

  function embedSrc(showUrl) {
    var feed = encodeURIComponent(new URL(showUrl).pathname);
    return (
      'https://player-widget.mixcloud.com/?hide_cover=1&hide_tracklist=1&hide_artwork=1&mini=1&feed=' +
      feed
    );
  }

  function renderShows() {
    var root = document.getElementById('mixes-list');
    if (!root || typeof PRISSS_SHOWS === 'undefined') return;

    var frag = document.createDocumentFragment();

    PRISSS_SHOWS.forEach(function (show) {
      var card = document.createElement('article');
      card.className = 'mix-card';

      var title = document.createElement('h2');
      title.className = 'mix-title';
      title.textContent = show.title;

      var wrap = document.createElement('div');
      wrap.className = 'mix-frame-wrap';

      var iframe = document.createElement('iframe');
      iframe.className = 'mix-frame';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay';
      iframe.src = embedSrc(show.url);
      iframe.title = show.title;

      wrap.appendChild(iframe);

      card.appendChild(title);
      card.appendChild(wrap);
      frag.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(frag);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderShows);
  } else {
    renderShows();
  }
})();