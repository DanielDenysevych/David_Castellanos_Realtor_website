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
     4. Featured listing gallery
     --------------------------------------------------- */
  var gThumbs = $('#galleryThumbs');
  var gMain   = $('#galleryMain');
  if (gThumbs && gMain) {
    gThumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('.feature__thumb');
      if (!btn) return;
      var img = $('img', btn);
      gMain.src = btn.dataset.full;
      gMain.alt = img ? img.alt : gMain.alt;
      $$('.feature__thumb', gThumbs).forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  }

  /* ---------------------------------------------------
     5. Listing search — filters the listings in place.
        Each listing carries data-price / data-area /
        data-intent; "Sell" jumps to the valuation section
        instead. Swap in a real MLS feed later and this
        same markup keeps working.
     --------------------------------------------------- */
  var listingSearch = $('#listingSearch');
  if (listingSearch) {
    var intent = 'buy';
    var intentToggle = $('#intentToggle');
    if (intentToggle) {
      intentToggle.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        $$('button', intentToggle).forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        intent = btn.dataset.intent;
      });
    }

    var listingCards = $$('#listings [data-price]');
    var emptyMsg = $('#listingsEmpty');
    var commercial = $('#listingsCommercial');

    function budgetBounds(v) {
      switch (v) {
        case 'Under $250,000':       return [0, 249999];
        case '$250,000 to $400,000': return [250000, 400000];
        case '$400,000 to $600,000': return [400000, 600000];
        case 'Over $600,000':        return [600001, Infinity];
        default:                     return [0, Infinity]; // "Any"
      }
    }

    function runSearch() {
      var area = $('#areaSelect').value;
      var bounds = budgetBounds($('#budgetSelect').value);
      var shown = 0;

      listingCards.forEach(function (card) {
        var price = parseFloat(card.dataset.price) || 0;
        var intents = (card.dataset.intent || 'buy').split(/\s+/);
        var match =
          intents.indexOf(intent) !== -1 &&
          (area === 'Anywhere in Brandon' || area === card.dataset.area) &&
          price >= bounds[0] && price <= bounds[1];
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });

      // hide the "Commercial & land" block when none of its cards show
      if (commercial) {
        var anyComm = $$('.listing-card', commercial).some(function (c) {
          return !c.classList.contains('is-hidden');
        });
        commercial.classList.toggle('is-hidden', !anyComm);
      }

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
      var anchor = $('#listings [data-price]:not(.is-hidden)') || emptyMsg;
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------------------------------------------------
     6. Mortgage calculator (Canadian semi-annual compounding)
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
     7. Review slider
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
     8. Forms — placeholder handlers
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
     9. Footer year
     --------------------------------------------------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
