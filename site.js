/* Khanya Dental Studio — concept demo.
   Progressive enhancement only. Every page works with JS disabled; this adds
   the mobile nav and gives the booking form an honest outcome.

   There is no backend on a demo deploy. Rather than silently swallowing a
   submission — which on a *dental* site would mean a visitor believing they
   have booked an appointment that does not exist — we say so plainly and hand
   over a pre-filled mailto.

   The result panel is built with DOM nodes and textContent rather than
   innerHTML, so user-entered values can never be parsed as markup. */
(function () {
  'use strict';

  /* ---- mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close when a link is chosen, so in-page anchors don't leave the menu up.
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    // Escape closes it too — the menu covers the page on a phone.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---- motion -----------------------------------------------------------
     All of this is enhancement. If the visitor has asked for reduced motion we
     unhide everything and return, rather than running a cheaper animation —
     "less motion" means none, not less. */
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var REVEAL = '.sec-head, .card, .well, .svc-card, .about-figure, .about-copy,'
    + '.prac-pair, .stat, .stats-note, .quote, .post, .note-box, .price-row,'
    + '.cta-band, .foot-top, .reviews';

  if (still || !('IntersectionObserver' in window)) {
    // No observer (or no appetite for motion): show everything immediately.
    document.querySelectorAll(REVEAL).forEach(function (el) { el.classList.add('is-in'); });
  } else {
    /* Stagger is applied per GROUP rather than per element. Indexing every
       match on the page would give the footer a two-second delay; resetting
       the counter for each parent keeps every group's cascade short. */
    var groups = new Map();
    document.querySelectorAll(REVEAL).forEach(function (el) {
      var parent = el.parentElement;
      var n = groups.get(parent) || 0;
      groups.set(parent, n + 1);
      el.style.setProperty('--rd', Math.min(n, 5) * 80 + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);          // reveal once; never re-hide on scroll up
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    document.querySelectorAll(REVEAL).forEach(function (el) { io.observe(el); });

    /* Prime whatever is already on screen.
       The observer deliberately holds elements back until they are 12% inside
       the viewport, which is what makes the reveal feel deliberate while
       scrolling. But it also means an element straddling the bottom edge at
       load is visible to the reader and still sitting at opacity:0 — blank
       until they happen to scroll. Anything touching the real viewport on the
       first frame is therefore revealed immediately. */
    requestAnimationFrame(function () {
      document.querySelectorAll(REVEAL).forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    });
  }

  /* Chips arrive in sequence — the index drives the CSS animation-delay. */
  document.querySelectorAll('.chips .chip').forEach(function (el, i) {
    el.style.setProperty('--i', i);
  });

  /* ---- counting stats ----------------------------------------------------
     Counts up once, when the row first comes into view. */
  if (!still && 'IntersectionObserver' in window) {
    var nums = document.querySelectorAll('.stat-n[data-count]');
    if (nums.length) {
      var numIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          numIo.unobserve(e.target);
          var el = e.target;
          var target = parseFloat(el.getAttribute('data-count'));
          var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          var suffix = el.getAttribute('data-suffix') || '';
          var started = null;
          var DURATION = 1400;

          function frame(now) {
            if (started === null) started = now;
            var t = Math.min(1, (now - started) / DURATION);
            // easeOutExpo — fast off the mark, long settle. Reads as precise
            // rather than as a slot machine.
            var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (t < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { numIo.observe(el); });
    }
  }

  /* ---- reading progress -------------------------------------------------- */
  if (!still) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);

    var ticking = false;
    function updateBar() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      // Only ever writes a custom property the CSS turns into a transform, so
      // the browser composites rather than re-laying-out on every scroll tick.
      bar.style.setProperty('--p', max > 0 ? (doc.scrollTop / max).toFixed(4) : '0');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateBar); }
    }, { passive: true });
    updateBar();
  }

  /* ---- booking form ----------------------------------------------------- */
  var form = document.querySelector('form[data-demo-form]');
  var out = document.getElementById('form-result');
  if (!form || !out) return;

  /* Deep links elsewhere on the site carry ?service=Whitening etc. Preselect
     it, but only when the value is one the <select> actually offers. */
  var wanted = new URLSearchParams(location.search).get('service');
  var select = form.elements.service;
  if (wanted && select) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) { select.selectedIndex = i; break; }
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var lines = [];
    data.forEach(function (value, key) {
      if (String(value).trim()) lines.push(key + ': ' + value);
    });

    var mailto = 'mailto:hello@phuturedigital.co.za'
      + '?subject=' + encodeURIComponent('Khanya concept demo — ' + (data.get('service') || 'General enquiry'))
      + '&body=' + encodeURIComponent(lines.join('\n'));

    var box = el('div', 'note-box');
    box.setAttribute('role', 'status');
    box.appendChild(el('b', null, 'No appointment has been booked.'));
    box.appendChild(document.createTextNode(
      ' Khanya Dental Studio is an invented brand and this is a concept demo — '
      + 'there is no practice, no diary and no server behind this form. Your '
      + 'answers have been packaged into an email to Phuture Digital instead; '
      + 'press the button to open it in your mail app.'
    ));

    var row = el('div', 'btn-row mt-s');
    var send = el('a', 'btn btn-gold', 'Open pre-filled email');
    send.setAttribute('href', mailto);
    row.appendChild(send);
    box.appendChild(row);

    out.replaceChildren(box);
    out.hidden = false;
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
