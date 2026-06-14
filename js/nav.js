(function () {
  'use strict';

  var loading = false;

  var PAGE_BOOT = {
    'js/visuals.js': function () {
      if (typeof window.PRISSS_VISUALS_BOOT === 'function') window.PRISSS_VISUALS_BOOT();
    },
    'js/bio.js': function () {
      if (typeof window.PRISSS_BIO_BOOT === 'function') window.PRISSS_BIO_BOOT();
    },
    'js/mixes.js': function () {
      if (typeof window.PRISSS_MIXES_RENDER === 'function') window.PRISSS_MIXES_RENDER();
    },
    'js/dj-sets.js': function () {
      if (typeof window.PRISSS_SETS_RENDER === 'function') window.PRISSS_SETS_RENDER();
    },
    'js/formspree-form.js': function () {
      if (typeof window.PRISSS_FORM_BOOT === 'function') window.PRISSS_FORM_BOOT();
    },
    'js/embed-audio.js': function () {
      if (typeof window.PRISSS_EMBED_AUDIO_BOOT === 'function') window.PRISSS_EMBED_AUDIO_BOOT();
    },
  };



  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
    if (anchor.origin !== location.origin) return false;
    var path = anchor.pathname.replace(/\/index\.html$/, '/');
    return (
      path === '/' ||
      path === '/bookings.html' ||
      path === '/mixes.html' ||
      path === '/dj-sets.html'
    );
  }

  function pageScripts(path) {
    if (path === '/' || path === '/index.html') return ['js/visuals.js', 'js/bio.js'];
    if (path === '/bookings.html') return ['js/formspree-form.js'];
    if (path === '/mixes.html') return ['js/mixes-data.js', 'js/mixes.js', 'js/embed-audio.js'];
    if (path === '/dj-sets.html') return ['js/dj-sets-data.js', 'js/dj-sets.js', 'js/embed-audio.js'];
    return [];
  }

  function loadScript(src) {
    var existing = document.querySelector('script[data-page-script="' + src + '"]');
    if (existing) {
      var boot = PAGE_BOOT[src];
      if (boot) boot();
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src + '?nav=' + Date.now();
      script.dataset.pageScript = src;
      script.onload = function () {
        var boot = PAGE_BOOT[src];
        if (boot) boot();
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function applyLayout(page) {
    document.body.dataset.page = page;
    document.documentElement.dataset.page = page;

    if (page === 'home') {
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.documentElement.style.touchAction = '';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.minHeight = '';
      document.body.style.cursor = '';
      document.body.style.touchAction = '';
    } else {
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.touchAction = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.minHeight = '100%';
      document.body.style.cursor = 'auto';
      document.body.style.touchAction = '';
    }
  }

  function swapPageStyles(doc) {
    var incoming = doc.getElementById('page-styles');
    var current = document.getElementById('page-styles');
    if (!incoming) return;
    if (current) {
      current.textContent = incoming.textContent;
      return;
    }
    document.head.appendChild(incoming.cloneNode(true));
  }

  function swapBody(doc) {
    var audio = document.getElementById('site-audio');
    Array.from(document.body.childNodes).forEach(function (node) {
      if (node !== audio) node.remove();
    });

    Array.from(doc.body.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.id === 'site-audio') return;
      if (node.nodeName === 'SCRIPT') return;
      document.body.appendChild(node.cloneNode(true));
    });

    var page = doc.body.dataset.page || 'sub';
    applyLayout(page);
    document.title = doc.title;

    var description = doc.querySelector('meta[name="description"]');
    if (description) {
      var current = document.querySelector('meta[name="description"]');
      if (!current) {
        current = document.createElement('meta');
        current.name = 'description';
        document.head.appendChild(current);
      }
      current.content = description.content;
    }
  }

  function runScripts(path) {
    var scripts = pageScripts(path);
    return scripts.reduce(function (chain, src) {
      return chain.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  function resumeAmbientAudio() {
    if (window.PRISSS_AUDIO && typeof window.PRISSS_AUDIO.resumeIfPlaying === 'function') {
      window.PRISSS_AUDIO.resumeIfPlaying();
    }
  }

  function teardownPageScripts(path) {
    if (path === '/' || path === '/index.html') {
      if (typeof window.PRISSS_VISUALS_TEARDOWN === 'function') {
        window.PRISSS_VISUALS_TEARDOWN();
      }
    }
  }

  function navigate(url, push) {
    if (loading) return;
    loading = true;

    var leaving = location.pathname.replace(/\/index\.html$/, '/') || '/';
    teardownPageScripts(leaving);

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('Navigation failed');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var path = new URL(url, location.origin).pathname.replace(/\/index\.html$/, '/') || '/';
        swapPageStyles(doc);
        swapBody(doc);
        window.scrollTo(0, 0);
        if (push) history.pushState({ url: url }, '', url);
        return runScripts(path);
      })
      .then(function () {
        resumeAmbientAudio();
      })
      .catch(function () {
        location.href = url;
      })
      .finally(function () {
        loading = false;
      });
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var anchor = event.target.closest('a');
    if (!isInternalLink(anchor)) return;
    event.preventDefault();
    navigate(anchor.href, true);
  });

  window.addEventListener('popstate', function () {
    navigate(location.href, false);
  });

  if (!history.state) {
    history.replaceState({ url: location.href }, '', location.href);
  }

  applyLayout(document.body.dataset.page || 'sub');
})();