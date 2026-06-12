(function () {
  'use strict';

  var loading = false;

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
    if (path === '/' || path === '/index.html') return ['js/visuals.js'];
    if (path === '/bookings.html') return ['js/formspree-form.js'];
    if (path === '/mixes.html') return ['js/mixes-data.js', 'js/mixes.js', 'js/embed-audio.js'];
    if (path === '/dj-sets.html') return ['js/dj-sets-data.js', 'js/dj-sets.js', 'js/embed-audio.js'];
    return [];
  }

  function clearPageScripts() {
    document.querySelectorAll('script[data-page-script]').forEach(function (node) {
      node.remove();
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src + '?nav=' + Date.now();
      script.dataset.pageScript = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function applyLayout(doc) {
    var page = doc.body.dataset.page || 'sub';
    document.body.dataset.page = page;
    if (page === 'home') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.cursor = '';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.cursor = 'auto';
    }
  }

  function swapBody(doc) {
    var audio = document.getElementById('site-audio');
    var keep = audio;
    Array.from(document.body.childNodes).forEach(function (node) {
      if (node !== keep) node.remove();
    });

    Array.from(doc.body.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.id === 'site-audio') return;
      if (node.nodeName === 'SCRIPT') return;
      document.body.appendChild(node.cloneNode(true));
    });

    applyLayout(doc);
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
    clearPageScripts();
    var scripts = pageScripts(path);
    return scripts.reduce(function (chain, src) {
      return chain.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  function navigate(url, push) {
    if (loading) return;
    loading = true;

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('Navigation failed');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var path = new URL(url, location.origin).pathname.replace(/\/index\.html$/, '/') || '/';
        swapBody(doc);
        window.scrollTo(0, 0);
        if (push) history.pushState({ url: url }, '', url);
        return runScripts(path);
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
})();