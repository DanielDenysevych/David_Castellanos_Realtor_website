/* =========================================================
   David Castellanos — rebrand
   Vanilla JS, no dependencies, no build step.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------
     1. Sticky nav state
     --------------------------------------------------- */
  var nav = $('#nav');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-stuck', y > window.innerHeight * 0.72);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------
     2. Mobile menu
     --------------------------------------------------- */
  var burger = $('#burger');
  var navLinks = $('#navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------------------------------------------
     3. Fade-in, applied only to media blocks.
        Text never moves on scroll - that was the single
        most template-looking thing on the page.
     --------------------------------------------------- */
  var reveals = $$('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------
     4. Listings — built from data/listings.json, then
        wired to the detail modal + the search filter.
        That file is refreshed by the CREA DDF sync
        (scripts/sync-listings.mjs / the sync-listings
        GitHub Action); nothing here changes when a
        listing is added or removed.
     --------------------------------------------------- */
  var listingsGrid = $('#listingCards');
  var lModal       = $('#listingModal');
  var lModalBody   = $('#listingModalBody');
  var emptyMsg     = $('#listingsEmpty');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildCard(item) {
    var art = el('article', 'listing-card');
    art.dataset.price  = item.price || 0;
    art.dataset.area   = item.area || '';
    art.dataset.intent = item.intent || 'buy invest';
    if (item.mls) art.dataset.mls = item.mls;

    var photos = (item.photos && item.photos.length) ? item.photos : [{ src: '', alt: '' }];

    /* --- summary card --- */
    var btn = el('button', 'listing-card__open');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');

    var media = el('span', 'listing-card__media');
    var cover = el('img');
    cover.src = photos[0].src;
    cover.alt = (item.address || 'Listing') + ', Brandon';
    cover.loading = 'lazy';
    media.appendChild(cover);
    media.appendChild(el('span', 'chip chip--active', item.status || 'Active'));
    media.appendChild(el('span', 'listing-card__kind', item.kind || ''));

    var body = el('span', 'listing-card__body');
    body.appendChild(el('span', 'listing-card__price', item.priceLabel || ''));
    var addr = el('span', 'listing-card__addr', item.address || '');
    addr.appendChild(el('span', null, item.areaLabel || ''));
    body.appendChild(addr);
    body.appendChild(el('span', 'listing-card__spec', item.spec || ''));
    body.appendChild(el('span', 'listing-card__more', 'View details'));

    btn.appendChild(media);
    btn.appendChild(body);
    art.appendChild(btn);

    /* --- detail template (cloned into the modal on click) --- */
    var tpl = el('template', 'listing-card__detail');
    var ld = el('div', 'ld');

    var gallery = el('div', 'ld__gallery' + (photos.length < 2 ? ' ld__gallery--single' : ''));
    var main = el('img', 'ld__main');
    main.src = photos[0].src;
    main.alt = photos[0].alt || '';
    gallery.appendChild(main);
    if (photos.length > 1) {
      var thumbs = el('div', 'ld__thumbs');
      photos.forEach(function (p, i) {
        var tb = el('button', 'ld__thumb' + (i === 0 ? ' is-active' : ''));
        tb.type = 'button';
        tb.dataset.full = p.src;
        var ti = el('img');
        ti.src = p.src; ti.alt = p.alt || ''; ti.loading = 'lazy';
        tb.appendChild(ti);
        thumbs.appendChild(tb);
      });
      gallery.appendChild(thumbs);
    }
    ld.appendChild(gallery);

    var info = el('div', 'ld__info');
    info.appendChild(el('p', 'ld__price', item.priceLabel || ''));
    info.appendChild(el('h3', 'ld__addr', item.address || ''));
    info.appendChild(el('p', 'ld__sub', item.sub || ''));
    if (item.description) info.appendChild(el('p', 'ld__desc', item.description));
    var dl = el('dl', 'ld__facts');
    (item.facts || []).forEach(function (row) {
      var d = el('div');
      d.appendChild(el('dt', null, row[0]));
      d.appendChild(el('dd', null, row[1]));
      dl.appendChild(d);
    });
    if (dl.children.length) info.appendChild(dl);
    if (item.office) info.appendChild(el('p', 'ld__office', 'Listed by ' + item.office));
    var cta = el('a', 'btn btn--solid', 'Ask about this property');
    cta.href = '#contact';
    cta.setAttribute('data-close', '');
    info.appendChild(cta);
    ld.appendChild(info);

    tpl.content.appendChild(ld);
    art.appendChild(tpl);
    return art;
  }

  function renderListings(items) {
    if (!listingsGrid) return;
    listingsGrid.replaceChildren();
    items.forEach(function (it) { listingsGrid.appendChild(buildCard(it)); });
    listingsGrid.removeAttribute('aria-busy');
  }

  function closeModal() {
    if (!lModal) return;
    if (lModal.close) lModal.close();
    else lModal.removeAttribute('open');
    document.body.style.overflow = '';
    if (lModalBody) lModalBody.replaceChildren();
  }

  function wireModalOpeners() {
    if (!lModal || !lModalBody || !listingsGrid) return;
    $$('.listing-card__open', listingsGrid).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.listing-card');
        var tpl = card && $('.listing-card__detail', card);
        if (!tpl) return;
        lModalBody.replaceChildren(tpl.content.cloneNode(true));
        lModalBody.scrollTop = 0;
        if (lModal.showModal) lModal.showModal();
        else lModal.setAttribute('open', '');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  function budgetBounds(v) {
    switch (v) {
      case 'Under $250,000':       return [0, 249999];
      case '$250,000 to $400,000': return [250000, 400000];
      case '$400,000 to $600,000': return [400000, 600000];
      case 'Over $600,000':        return [600001, Infinity];
      default:                     return [0, Infinity]; // "Any"
    }
  }

  function wireSearch() {
    var listingSearch = $('#listingSearch');
    if (!listingSearch) return;

    var intent = 'buy';
    var intentToggle = $('#intentToggle');
    if (intentToggle) {
      intentToggle.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        $$('button', intentToggle).forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        intent = b.dataset.intent;
      });
    }

    var cards = $$('#listingCards .listing-card');

    function runSearch() {
      var area = $('#areaSelect').value;
      var bounds = budgetBounds($('#budgetSelect').value);
      var shown = 0;
      cards.forEach(function (card) {
        var price = parseFloat(card.dataset.price) || 0;
        var intents = (card.dataset.intent || 'buy').split(/\s+/);
        var match =
          intents.indexOf(intent) !== -1 &&
          (area === 'Anywhere in Brandon' || area === card.dataset.area) &&
          price >= bounds[0] && price <= bounds[1];
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      if (emptyMsg) emptyMsg.hidden = shown > 0;
      return shown;
    }

    listingSearch.addEventListener('submit', function (e) {
      e.preventDefault();
      if (intent === 'sell') {
        var val = $('#valuation');
        if (val) val.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      runSearch();
      var anchor = $('#listingCards .listing-card:not(.is-hidden)') || emptyMsg;
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (listingsGrid) {
    /* modal chrome — attached once, works for any cloned detail */
    if (lModal && lModalBody) {
      lModal.addEventListener('click', function (e) {
        if (e.target === lModal || e.target.closest('[data-close]')) { closeModal(); return; }
        var thumb = e.target.closest('.ld__thumb');
        if (thumb) {
          var main = $('.ld__main', lModal);
          var img = $('img', thumb);
          if (main) { main.src = thumb.dataset.full; if (img) main.alt = img.alt; }
          $$('.ld__thumb', lModal).forEach(function (t) { t.classList.remove('is-active'); });
          thumb.classList.add('is-active');
        }
      });
      lModal.addEventListener('close', function () {
        document.body.style.overflow = '';
        lModalBody.replaceChildren();
      });
      lModal.addEventListener('cancel', function () { document.body.style.overflow = ''; });
    }

    fetch('data/listings.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (doc) {
        var items = (doc && doc.listings) || [];
        renderListings(items);
        wireModalOpeners();
        wireSearch();
        if (!items.length && emptyMsg) emptyMsg.hidden = false;
      })
      .catch(function () {
        listingsGrid.removeAttribute('aria-busy');
        if (emptyMsg) emptyMsg.hidden = false;
      });
  }

  /* ---------------------------------------------------
     5. Mortgage calculator (Canadian semi-annual compounding)
     --------------------------------------------------- */
  var cPrice = $('#cPrice');
  var cDown  = $('#cDown');
  var cRate  = $('#cRate');
  var cYears = $('#cYears');

  var money0 = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0
  });

  function parseMoney(v) {
    var n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  /* CMHC premium tiers on the mortgage amount, by down-payment % */
  function cmhcRate(downPct) {
    if (downPct >= 20) return 0;
    if (downPct >= 15) return 0.028;
    if (downPct >= 10) return 0.031;
    return 0.04;
  }

  function calc() {
    if (!cPrice || !cDown || !cRate || !cYears) return;

    var price   = parseMoney(cPrice.value);
    var downPct = parseFloat(cDown.value);
    var rate    = parseFloat(cRate.value);
    var years   = parseInt(cYears.value, 10);

    var downAmt   = price * (downPct / 100);
    var basePrin  = price - downAmt;
    var premium   = basePrin * cmhcRate(downPct);
    var principal = basePrin + premium;

    // Canadian mortgages compound semi-annually, not monthly.
    // Effective monthly rate = (1 + annual/2)^(1/6) - 1
    var i = Math.pow(1 + (rate / 100) / 2, 1 / 6) - 1;
    var n = years * 12;

    var payment = i === 0
      ? principal / n
      : principal * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    var totalInterest = (payment * n) - principal;

    $('#cDownPct').textContent  = downPct + '%';
    $('#cDownAmt').textContent  = money0.format(downAmt);
    $('#cRateOut').textContent  = rate.toFixed(2) + '%';
    $('#cYearsOut').textContent = years + ' yrs';

    $('#cPayment').textContent   = isFinite(payment) ? money0.format(payment) : '$0';
    $('#cPrincipal').textContent = money0.format(principal);
    $('#cInterest').textContent  = isFinite(totalInterest) ? money0.format(Math.max(totalInterest, 0)) : '$0';
    $('#cCmhc').textContent      = premium > 0 ? money0.format(premium) : 'Not required';
  }

  if (cPrice) {
    cPrice.addEventListener('input', function () {
      var raw = parseMoney(cPrice.value);
      cPrice.value = raw ? raw.toLocaleString('en-CA') : '';
      calc();
    });
    [cDown, cRate, cYears].forEach(function (el) {
      if (el) el.addEventListener('input', calc);
    });
    calc();
  }

  /* ---------------------------------------------------
     6. Review slider
     --------------------------------------------------- */
  var track = $('#quotesTrack');
  if (track) {
    var quotes = $$('.quote', track);
    var dotsWrap = $('#quotesDots');
    var current = 0;
    var timer = null;

    quotes.forEach(function (_, idx) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Review ' + (idx + 1));
      if (idx === 0) d.classList.add('is-active');
      d.addEventListener('click', function () { go(idx); });
      dotsWrap.appendChild(d);
    });

    function go(idx) {
      current = (idx + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) { q.classList.toggle('is-active', i === current); });
      $$('button', dotsWrap).forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
      restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(current + 1); }, 7000);
    }

    $('#qNext').addEventListener('click', function () { go(current + 1); });
    $('#qPrev').addEventListener('click', function () { go(current - 1); });
    restart();
  }

  /* ---------------------------------------------------
     7. Forms — placeholder handlers
        Replace with a real endpoint (Formspree, OpnForm,
        n8n webhook) before launch.
     --------------------------------------------------- */
  function stubForm(formId, noteId) {
    var form = $(formId);
    var note = $(noteId);
    if (!form || !note) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      note.hidden = false;
      form.reset();
    });
  }
  stubForm('#evalForm', '#evalNote');
  stubForm('#contactForm', '#contactNote');

  /* ---------------------------------------------------
     8. Footer year
     --------------------------------------------------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------
     9. Video card — cursor tilt + a spotlight that
        follows the pointer. Skipped on touch/coarse
        pointers and when the OS asks for less motion.
     --------------------------------------------------- */
  var canTilt = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canTilt) {
    $$('.video-card__media').forEach(function (card) {
      var maxDeg = 6;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var rotY = (x - 0.5) * maxDeg * 2;
        var rotX = (0.5 - y) * maxDeg * 2;
        card.style.transform = 'rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'rotateX(0) rotateY(0)';
      });
    });
  }

})();
