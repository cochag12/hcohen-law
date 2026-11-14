/* ח. כהן - site behaviour. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var CFG = {};
  try { CFG = JSON.parse((document.querySelector('meta[name="site-config"]') || {}).content || '{}'); } catch (e) { CFG = {}; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var ICONS = (document.querySelector('meta[name="icons"]') || {}).content || 'assets/img/icons.svg';
  function icon(id) { return '<svg class="icon" aria-hidden="true"><use href="' + ICONS + '#' + id + '"/></svg>'; }

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (to && !nav.contains(to) && to !== toggle && nav.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- practice-areas mega menu ---- */
  var dropBtn = document.querySelector('.nav-drop-btn');
  var mega = document.getElementById('mega');
  function setMega(open) {
    if (!dropBtn || !mega) return;
    mega.classList.toggle('open', open);
    dropBtn.setAttribute('aria-expanded', String(open));
  }
  if (dropBtn && mega) {
    var dropLi = dropBtn.parentElement, hoverOpened = false;
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (hoverOpened) { hoverOpened = false; setMega(true); return; }
      setMega(!mega.classList.contains('open'));
    });
    document.addEventListener('click', function (e) { if (!dropLi.contains(e.target)) setMega(false); });
    dropLi.addEventListener('focusout', function (e) { if (e.relatedTarget && !dropLi.contains(e.relatedTarget)) setMega(false); });
    var fine = window.matchMedia('(hover: hover) and (min-width: 1121px)');
    var t;
    dropLi.addEventListener('mouseenter', function () { if (fine.matches) { clearTimeout(t); if (!mega.classList.contains('open')) { hoverOpened = true; setMega(true); setTimeout(function () { hoverOpened = false; }, 400); } } });
    dropLi.addEventListener('mouseleave', function () { if (fine.matches && !dropLi.contains(document.activeElement)) { t = setTimeout(function () { setMega(false); }, 300); } });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mega && mega.classList.contains('open')) { var inMega = dropBtn.parentElement.contains(document.activeElement); setMega(false); if (inMega) dropBtn.focus(); }
    if (nav && nav.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    if (panel && panel.classList.contains('open')) { var inPanel = panel.contains(document.activeElement); closeA11y(); if (inPanel) a11yBtn.focus(); }
  });

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- counters (final value is already in the HTML) ---- */
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = +el.getAttribute('data-count'), start = +(el.getAttribute('data-from') || 0), t0 = null;
        cio.unobserve(el);
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1300, 1);
          el.textContent = Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* ---- filters (articles, matters) ---- */
  document.querySelectorAll('.filters').forEach(function (bar) {
    var items = document.querySelectorAll(bar.getAttribute('data-target'));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var f = b.getAttribute('data-filter'), shown = 0;
      items.forEach(function (it) {
        var on = f === 'all' || (' ' + it.getAttribute('data-cat') + ' ').indexOf(' ' + f + ' ') > -1;
        it.hidden = !on; if (on) shown++;
      });
      var live = document.getElementById(bar.getAttribute('data-live'));
      if (live) live.textContent = b.textContent.trim() + ': ' + (shown ? 'מוצגים ' + shown + ' פריטים' : 'אין פריטים בקטגוריה זו');
    });
  });

  /* ---- share: copy link ---- */
  document.querySelectorAll('[data-copy-link]').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.querySelector('span'); b.setAttribute('aria-live', 'polite');
      var ok = function () { label.textContent = 'הקישור הועתק'; };
      var fail = function () { label.textContent = 'לא ניתן להעתיק - העתיקו מסרגל הכתובת'; };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(ok, fail); else fail();
    });
  });

  /* ---- article: copy suggested citation ---- */
  document.querySelectorAll('[data-copy-cite]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('.cite-box'), txt = box.querySelector('.cite-text').textContent, st = box.querySelector('.cite-status');
      var ok = function () { st.textContent = 'האזכור הועתק'; };
      var fail = function () { st.textContent = 'לא ניתן להעתיק - סמנו את הטקסט והעתיקו'; };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, fail); else fail();
    });
  });

  /* ---- contact form ---- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.noValidate = true;
    var params = new URLSearchParams(location.search);
    var wanted = params.get('topic');   /* only a value that exists in the list - anything else would leave no option selected */
    if (wanted && form.topic && [].some.call(form.topic.options, function (o) { return o.value === wanted; })) form.topic.value = wanted;
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;   /* the button ships disabled so a no-JS visitor cannot POST personal data to the host */
    var status = document.getElementById('form-status');
    function setErr(field, msg) {
      var el = form.querySelector('[name="' + field + '"]');
      var err = document.getElementById('err-' + field);
      if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg || ''; err.classList.toggle('show', !!msg); }
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      var checks = [
        ['name', form.elements['name'].value.trim().length >= 2 ? '' : 'נא למלא שם מלא'],
        ['phone', /^[0-9+\-\s()]{9,}$/.test(form.phone.value.trim()) ? '' : 'נא למלא מספר טלפון של 9 ספרות לפחות (אפשר עם מקף)'],
        ['email', !form.email.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()) ? '' : 'כתובת הדוא"ל אינה תקינה'],
        ['consent', form.consent.checked ? '' : 'כדי לשלוח את הפנייה יש לסמן את תיבת ההסכמה לשמירת הפרטים']
      ];
      checks.forEach(function (c) { if (!setErr(c[0], c[1])) { ok = false; if (!first) first = form.querySelector('[name="' + c[0] + '"]'); } });
      if (!ok) { status.className = 'form-status err'; status.textContent = 'יש לתקן את השדות המסומנים.'; first.focus(); return; }
      if (CFG.form === 'mailto') {
        /* no form backend on this host: hand the inquiry to the visitor's mail app */
        var v = function (n) { return form.elements[n] && form.elements[n].value ? form.elements[n].value.trim() : ''; };
        var topic = form.topic && form.topic.selectedIndex >= 0 ? form.topic.options[form.topic.selectedIndex].text : '';
        var head = ['(נא לא לצרף מסמכים ולא לפרט שמות צדדים או מספרי תיק לפני שנוצרה התקשרות)', '', 'שם: ' + v('name'), 'טלפון: ' + v('phone')];
        if (v('org')) head.push('גוף / ארגון: ' + v('org'));
        if (v('role')) head.push('תפקיד: ' + v('role'));
        if (v('email')) head.push('דוא"ל: ' + v('email'));
        head.push('נושא: ' + topic);
        /* the mail's own timestamp records when the privacy notice was accepted */
        var consentLine = '\n\n---\nקראתי את הודעת הפרטיות שבטופס ואני מסכים/ה לשמירת הפרטים לצורך מענה ובדיקת ניגוד עניינים.';
        var build = function (m) { return 'mailto:' + (CFG.email || '') + '?subject=' + encodeURIComponent('פנייה מהאתר - ' + topic) + '&body=' + encodeURIComponent(head.join('\n') + (m ? '\n\n' + m : '') + consentLine); };
        var msg = v('message'), url = build(msg);
        while (url.length > 1900 && msg.length > 0) { msg = msg.slice(0, Math.max(0, msg.length - 100)); url = build(msg + '... (ההודעה קוצרה - אפשר להשלים כאן)'); }
        window.location.href = url;
        status.className = 'form-status ok';
        status.innerHTML = 'נפתחה תוכנת הדואר שלכם עם הפנייה - יש ללחוץ שם על "שלח". אם היא לא נפתחה, אפשר לכתוב אל <a href="mailto:' + (CFG.email || '') + '">' + (CFG.email || '') + '</a> או להתקשר <a href="tel:' + (CFG.phone_intl || '') + '">' + (CFG.phone || '') + '</a>.';
        status.focus();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'שולח...';
      var data = new FormData(form);
      data.set('consent_at', new Date().toISOString());
      fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'הפנייה התקבלה. נחזור אליכם בהקדם.';
        })
        .catch(function () {
          status.className = 'form-status err';
          status.innerHTML = 'לא הצלחנו לשלוח את הטופס מכאן. <a href="mailto:' + (CFG.email || '') + '?subject=' + encodeURIComponent('פנייה מהאתר') + '">שליחה בדוא"ל</a> או טלפון <a href="tel:' + (CFG.phone_intl || '') + '">' + (CFG.phone || '') + '</a>.';
        })
        .then(function () { btn.disabled = false; btn.textContent = 'שליחת הפנייה'; status.focus(); });
    });
  }

  /* ---- accessibility menu ---- */
  var a11yState = {};
  try { a11yState = JSON.parse(store.get('a11y') || '{}') || {}; } catch (e) { a11yState = {}; }
  function applyA11y() {
    root.classList.remove('a11y-text-1', 'a11y-text-2');
    if (a11yState.text) root.classList.add('a11y-text-' + a11yState.text);
    ['contrast', 'links', 'readable', 'still'].forEach(function (k) { root.classList.toggle('a11y-' + k, !!a11yState[k]); });
  }
  applyA11y();
  var a11yBtn = document.createElement('button');
  a11yBtn.className = 'a11y-btn'; a11yBtn.type = 'button';
  a11yBtn.setAttribute('aria-label', 'תפריט נגישות'); a11yBtn.setAttribute('aria-expanded', 'false'); a11yBtn.setAttribute('aria-controls', 'a11y-panel');
  a11yBtn.innerHTML = icon('i-access');
  var panel = document.createElement('div');
  panel.className = 'a11y-panel'; panel.id = 'a11y-panel'; panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', 'a11y-h'); panel.setAttribute('lang', 'he'); panel.setAttribute('dir', 'rtl');
  panel.innerHTML = '<h2 id="a11y-h">הגדרות נגישות</h2><div class="a11y-grid">' +
    '<button type="button" data-a="text">הגדלת טקסט</button>' +
    '<button type="button" data-a="contrast">ניגודיות גבוהה</button>' +
    '<button type="button" data-a="links">הדגשת קישורים</button>' +
    '<button type="button" data-a="readable">גופן קריא</button>' +
    '<button type="button" data-a="close">סגירה</button></div>' +
    '<div class="a11y-foot"><a href="' + (CFG.base || '') + 'accessibility.html">הצהרת נגישות</a><button type="button" data-a="reset">איפוס</button></div>';
  document.body.appendChild(a11yBtn); document.body.appendChild(panel);
  function syncPressed() {
    panel.querySelectorAll('[data-a]').forEach(function (b) {
      var k = b.getAttribute('data-a');
      if (k === 'text') { b.setAttribute('aria-pressed', String(!!a11yState.text)); b.textContent = a11yState.text ? 'הגדלת טקסט (' + a11yState.text + ')' : 'הגדלת טקסט'; }
      else if (['contrast', 'links', 'readable', 'still'].indexOf(k) > -1) b.setAttribute('aria-pressed', String(!!a11yState[k]));
    });
  }
  function closeA11y() { panel.classList.remove('open'); a11yBtn.setAttribute('aria-expanded', 'false'); }
  a11yBtn.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    a11yBtn.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('button').focus();
  });
  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var k = b.getAttribute('data-a');
    if (k === 'close') { closeA11y(); a11yBtn.focus(); return; }
    if (k === 'reset') { a11yState = {}; store.del('a11y'); }
    else if (k === 'text') { a11yState.text = ((a11yState.text || 0) + 1) % 3; }
    else { a11yState[k] = !a11yState[k]; }
    store.set('a11y', JSON.stringify(a11yState)); applyA11y(); syncPressed();
  });
  syncPressed();

  /* ---- analytics: loaded only after consent, and only if configured ---- */
  function loadGA() {
    if (!CFG.ga4 || !/^G-[A-Z0-9]+$/.test(CFG.ga4) || window.gtag) return;
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.ga4;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', CFG.ga4);
  }
  if (CFG.ga4) {
    var choice = store.get('consent-analytics');
    if (choice === 'yes') loadGA();
    else if (choice !== 'no') {
      var bar = document.createElement('div');
      bar.className = 'consent-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'הסכמה לעוגיות');
      bar.innerHTML = '<p>האתר משתמש בעוגיות ניתוח (Google Analytics) רק אם תאשרו. <a href="' + (CFG.base || '') + 'privacy.html">מדיניות הפרטיות</a></p><div class="btns"><button type="button" class="btn btn-outline" data-c="yes">אישור</button><button type="button" class="btn btn-outline" data-c="no">דחייה</button></div>';
      document.body.appendChild(bar);
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-c]'); if (!b) return;
        store.set('consent-analytics', b.getAttribute('data-c'));
        if (b.getAttribute('data-c') === 'yes') loadGA();
        bar.remove();
      });
    }
  }
  document.querySelectorAll('[data-open-consent]').forEach(function (b) { b.addEventListener('click', function () { store.del('consent-analytics'); location.reload(); }); });
})();
