/* Applies saved accessibility settings before first paint (loaded in <head>). */
(function () { try { var s = JSON.parse(localStorage.getItem('a11y') || '{}') || {}, r = document.documentElement;
  if (s.text) r.classList.add('a11y-text-' + s.text);
  ['contrast', 'links', 'readable', 'still'].forEach(function (k) { if (s[k]) r.classList.add('a11y-' + k); });
} catch (e) {} })();
