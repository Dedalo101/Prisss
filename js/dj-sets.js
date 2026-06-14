(function () {
  'use strict';

  function embedSrc(trackId) {
    return (
      'https://hearthis.at/embed/' +
      trackId +
      '/transparent/?style=2&block_size=2&block_space=2&background=1'
    );
  }

  function renderSets() {
    var root = document.getElementById('dj-sets-list');
    if (!root || typeof PRISSS_DJ_SETS === 'undefined') return;

    var frag = document.createDocumentFragment();

    PRISSS_DJ_SETS.forEach(function (set) {
      var card = document.createElement('article');
      card.className = 'set-card';

      var title = document.createElement('h2');
      title.className = 'set-title';
      title.textContent = set.title;

      var iframe = document.createElement('iframe');
      iframe.className = 'set-frame';
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay';
      iframe.src = embedSrc(set.id);
      iframe.title = set.title;

      card.appendChild(title);
      card.appendChild(iframe);
      frag.appendChild(card);
    });

    root.innerHTML = '';
    root.appendChild(frag);
  }

  window.PRISSS_SETS_RENDER = renderSets;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSets);
  } else {
    renderSets();
  }
})();