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
  function navIsOpen() { return !!(mobileNav && mobileNav.classList.contains('open')); }
  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    updateStickyCta();
  }
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      updateStickyCta();
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
    var navLinks = document.querySelectorAll('.navlinks a[href^="#"]');
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

  /* ---------- analytics, loaded only with consent ---------- */
  var CONSENT_KEY = 'vfactor-consent';
  var analyticsLoaded = false;

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }
  function loadAnalytics() {
    if (analyticsLoaded) return;
    var endpoint = root.getAttribute('data-analytics');
    if (!endpoint) return;
    analyticsLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-goatcounter', endpoint);
    s.src = '//gc.zgo.at/count.js';
    document.body.appendChild(s);
  }
  function track(path) {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: path, event: true });
    }
  }

  /* ---------- cookie banner ---------- */
  var banner = document.getElementById('cookie-banner');
  function bannerVisible() { return !!(banner && banner.classList.contains('show')); }
  function hideBanner() {
    if (banner) banner.classList.remove('show');
    updateStickyCta();
  }
  if (readConsent() === 'granted') {
    loadAnalytics();
  } else if (banner && readConsent() !== 'denied') {
    banner.classList.add('show');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-consent]'), function (el) {
    el.addEventListener('click', function () {
      var choice = el.getAttribute('data-consent');
      if (choice === 'accept') {
        writeConsent('granted');
        hideBanner();
        loadAnalytics();
      } else if (choice === 'decline') {
        writeConsent('denied');
        hideBanner();
      } else if (choice === 'reset') {
        // analytics already running stays for this page view; the choice is
        // cleared so the banner asks again, and nothing loads on the next one
        try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
        if (banner) {
          banner.classList.add('show');
          updateStickyCta();
          banner.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
        }
      }
    });
  });

  /* ---------- sticky mobile call to action ---------- */
  var stickyCta = document.getElementById('sticky-cta');
  var heroEl = document.querySelector('.hero');
  var contactEl = document.getElementById('contact');
  var footEl = document.querySelector('footer');

  function updateStickyCta() {
    if (!stickyCta) return;
    if (navIsOpen() || bannerVisible()) { stickyCta.classList.remove('show'); return; }

    // show once the hero call to action has scrolled away
    var pastHero = true;
    if (heroEl) pastHero = heroEl.getBoundingClientRect().bottom < 40;

    // hide again where the real contact options are already on screen
    var atDestination = false;
    [contactEl, footEl].forEach(function (el) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) atDestination = true;
    });

    stickyCta.classList.toggle('show', pastHero && !atDestination);
  }

  if (stickyCta) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateStickyCta(); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    Array.prototype.forEach.call(stickyCta.querySelectorAll('[data-track]'), function (el) {
      el.addEventListener('click', function () { track('sticky-cta/' + el.getAttribute('data-track')); });
    });
    updateStickyCta();
  }

  /* ---------- hero intent chips ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-target]'), function (chip) {
    chip.addEventListener('click', function () {
      var target = document.querySelector(chip.getAttribute('data-target'));
      if (!target) return;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      track('intent/' + chip.getAttribute('data-intent'));
    });
  });

  /* ---------- forms: inline validation, loading state, no redirect ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function fieldLabel(field) {
    var label = field.form.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent.replace(/\s*\(optional\)\s*/i, '').trim() : 'This field';
  }

  function validityMessage(field) {
    var value = (field.value || '').trim();

    if (field.type === 'checkbox') {
      return field.required && !field.checked
        ? 'Please tick this box so we can act on your message.'
        : '';
    }
    if (field.required && !value) {
      return fieldLabel(field) + ' is required.';
    }
    if (!value) return '';

    if (field.type === 'email' && !EMAIL_RE.test(value)) {
      return 'Enter a complete email address, for example name@company.com.';
    }
    if (field.type === 'tel' && value.replace(/[^0-9]/g, '').length < 7) {
      return 'Enter a phone number we can reach you on, including the country or area code.';
    }
    if (field.name === 'links' && !/^([a-z]+:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(value)) {
      return 'Enter a full link, for example linkedin.com/in/yourname.';
    }
    if (field.tagName === 'TEXTAREA' && field.required && value.length < 10) {
      return 'Please add a little more detail — at least a sentence.';
    }
    return '';
  }

  function errorNodeFor(field) {
    var id = (field.id || field.name) + '-error';
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement('p');
      node.className = 'field-error';
      node.id = id;
      node.setAttribute('role', 'alert');
      var anchor = field.type === 'checkbox' ? field.closest('.form-consent') : field;
      anchor.parentNode.insertBefore(node, anchor.nextSibling);
    }
    return node;
  }

  function showFieldError(field, message) {
    var node = errorNodeFor(field);
    var consent = field.type === 'checkbox' ? field.closest('.form-consent') : null;

    if (message) {
      node.textContent = message;
      node.classList.add('show');
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', node.id);
      if (consent) consent.classList.add('invalid');
    } else {
      node.textContent = '';
      node.classList.remove('show');
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      if (consent) consent.classList.remove('invalid');
    }
  }

  function validateForm(form) {
    var fields = form.querySelectorAll('input:not([type="hidden"]):not(.hp), textarea, select');
    var firstBad = null;
    Array.prototype.forEach.call(fields, function (field) {
      var message = validityMessage(field);
      showFieldError(field, message);
      if (message && !firstBad) firstBad = field;
    });
    return firstBad;
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-ajax]'), function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var buttonText = button ? button.textContent : '';

    // browser-native bubbles are replaced by the inline messages below;
    // without JS the markup keeps `required` and validates natively
    form.noValidate = true;

    var fields = form.querySelectorAll('input:not([type="hidden"]):not(.hp), textarea, select');
    Array.prototype.forEach.call(fields, function (field) {
      var event = field.type === 'checkbox' ? 'change' : 'blur';
      field.addEventListener(event, function () {
        showFieldError(field, validityMessage(field));
      });
      field.addEventListener('input', function () {
        // clear an error as soon as the person fixes it, never add one mid-typing
        if (field.getAttribute('aria-invalid') && !validityMessage(field)) showFieldError(field, '');
      });
    });

    function setBusy(busy) {
      form.setAttribute('aria-busy', busy ? 'true' : 'false');
      if (!button) return;
      button.disabled = busy;
      if (busy) {
        button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';
      } else {
        button.textContent = buttonText;
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: bots fill hidden fields, people don't
      var trap = form.querySelector('input[name="_gotcha"]');
      if (trap && trap.value) return;

      var firstBad = validateForm(form);
      if (firstBad) {
        if (status) {
          status.setAttribute('data-state', 'error');
          status.textContent = 'Please check the highlighted fields.';
        }
        firstBad.focus();
        return;
      }

      // accept linkedin.com/in/name as well as a full URL
      var url = form.querySelector('input[name="links"]');
      if (url && url.value.trim() && !/^https?:\/\//i.test(url.value.trim())) {
        url.value = 'https://' + url.value.trim();
      }

      if (status) {
        status.setAttribute('data-state', 'sending');
        status.textContent = 'Sending your message…';
      }
      setBusy(true);

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          track('form/' + (form.getAttribute('data-form') || 'submit'));
          form.reset();
          if (status) {
            status.setAttribute('data-state', 'ok');
            status.textContent = form.getAttribute('data-success') || 'Thanks — we have it. Vijay will reply within one business day.';
          }
          var next = form.getAttribute('data-redirect');
          if (next) {
            window.setTimeout(function () { window.location.href = next; }, 900);
          } else {
            setBusy(false);
          }
        })
        .catch(function () {
          if (status) {
            status.setAttribute('data-state', 'error');
            status.innerHTML = 'That did not send. Email <a href="mailto:' +
              (form.getAttribute('data-fallback-email') || '') + '">' +
              (form.getAttribute('data-fallback-email') || '') + '</a> instead.';
          }
          setBusy(false);
        });
    });
  });

  /* ---------- current year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
