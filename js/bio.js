(function () {
  'use strict';

  function boot() {
    var wrap = document.getElementById('title-wrap');
    var panel = document.getElementById('bio-panel');
    var backdrop = document.getElementById('bio-backdrop');
    var closeBtn = document.getElementById('bio-close');
    if (!wrap || !panel || !backdrop || !closeBtn) return;
    if (wrap.dataset.bioWired === '1') return;
    wrap.dataset.bioWired = '1';

    var open = false;

    function setOpen(next) {
      open = next;
      panel.hidden = !open;
      backdrop.hidden = !open;
      wrap.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        closeBtn.focus();
      }
    }

    function toggle() {
      setOpen(!open);
    }

    wrap.addEventListener('click', function (event) {
      event.preventDefault();
      toggle();
    });

    wrap.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });

    backdrop.addEventListener('click', function () {
      setOpen(false);
    });

    closeBtn.addEventListener('click', function () {
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && open) setOpen(false);
    });
  }

  window.PRISSS_BIO_BOOT = boot;

  if (document.body.dataset.page === 'home') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }
})();