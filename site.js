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
