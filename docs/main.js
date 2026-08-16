/* vFactor Solutions — site behaviour */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme toggle ---------- */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.classList.add('theming');
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('vfactor-theme', next); } catch (e) {}
      toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      window.setTimeout(function () { root.classList.remove('theming'); }, 600);
    });
  }

  /* ---------- mobile navigation ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ---------- active nav link ---------- */
  if ('IntersectionObserver' in window) {
    var navLinks = document.querySelectorAll('.navlinks a');
    var navSections = Array.prototype.map.call(navLinks, function (a) {
      return document.querySelector(a.getAttribute('href'));
    });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = navSections.indexOf(e.target);
        Array.prototype.forEach.call(navLinks, function (a) { a.classList.remove('active'); });
        if (idx > -1) navLinks[idx].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    navSections.forEach(function (s) { if (s) navIo.observe(s); });
  }

  /* ---------- hero intent chips ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-target]'), function (chip) {
    chip.addEventListener('click', function () {
      var target = document.querySelector(chip.getAttribute('data-target'));
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: 'intent/' + chip.getAttribute('data-intent'), event: true });
      }
    });
  });

  /* ---------- forms: submit in place, no redirect ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('form[data-ajax]'), function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button ? button.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: bots fill hidden fields, people don't
      var trap = form.querySelector('input[name="_gotcha"]');
      if (trap && trap.value) return;

      // accept linkedin.com/in/name as well as a full URL
      var url = form.querySelector('input[name="links"]');
      if (url && url.value.trim() && !/^https?:\/\//i.test(url.value.trim())) {
        url.value = 'https://' + url.value.trim();
      }

      if (status) { status.textContent = ''; status.removeAttribute('data-state'); }
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          if (status) {
            status.setAttribute('data-state', 'ok');
            status.textContent = form.getAttribute('data-success') || 'Thanks — we have it. Vijay will reply within one business day.';
          }
        })
        .catch(function () {
          if (status) {
            status.setAttribute('data-state', 'error');
            status.innerHTML = 'That did not send. Email <a href="mailto:' +
              (form.getAttribute('data-fallback-email') || '') + '">' +
              (form.getAttribute('data-fallback-email') || '') + '</a> instead.';
          }
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = buttonText; }
        });
    });
  });

  /* ---------- current year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();