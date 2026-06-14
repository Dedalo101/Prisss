(function () {
  'use strict';

  function wireForm(form) {
    if (!form || form.dataset.fsWired) return;
    form.dataset.fsWired = '1';

    var successEl = document.getElementById(form.dataset.successEl || '');
    var errorEl = document.getElementById(form.dataset.errorEl || '');
    var submitBtn = form.querySelector('[type="submit"]');
    var defaultBtnText = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = submitBtn.dataset.submittingText || 'Sending…';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then(function (res) {
          if (res.ok) {
            form.hidden = true;
            if (successEl) successEl.hidden = false;
            return;
          }
          if (errorEl) errorEl.hidden = false;
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = defaultBtnText;
          }
        });
    });
  }

  function boot() {
    document.querySelectorAll('form[data-formspree-ajax]').forEach(wireForm);
  }

  window.PRISSS_FORM_BOOT = boot;
  boot();
})();