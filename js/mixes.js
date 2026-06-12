(function () {
  'use strict';

  function embedSrc(showUrl) {
    var feed = encodeURIComponent(new URL(showUrl).pathname);
    return 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=' + feed;
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

      var iframe = document.createElement('iframe');
      iframe.className = 'mix-frame';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay';
      iframe.src = embedSrc(show.url);
      iframe.title = show.title;

      card.appendChild(title);
      card.appendChild(iframe);
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