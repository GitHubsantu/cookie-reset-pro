/**
 * Cookie Reset Pro - Injected Script
 * Loaded into page context via <script src> — CSP-safe.
 * Has access to window.* but NOT to extension APIs.
 */

(function () {
  'use strict';

  // ─── Clear tracking globals ────────────────────────────────────────────

  const trackingVars = [
    '_ga', '_gid', '_gat',
    '__utma', '__utmb', '__utmc', '__utmz',
    '_fbp', 'fbq',
    'dataLayer', 'gtag', 'gaData', 'gaGlobal',
    'optimizely', 'amplitude', 'mixpanel',
    'segment', 'analytics',
    'trackjs', 'bugsnag', 'sentry'
  ];

  trackingVars.forEach(v => {
    try { if (window[v] !== undefined) delete window[v]; } catch (e) {}
  });

  // ─── Clear framework state globals ────────────────────────────────────

  const stateVars = [
    '__INITIAL_STATE__', '__REDUX_STATE__',
    '__NEXT_DATA__', '__NUXT__',
    '__DATA__', '__APP_STATE__'
  ];

  stateVars.forEach(v => {
    try { if (window[v] !== undefined) delete window[v]; } catch (e) {}
  });

  // ─── Clear Web Storage ────────────────────────────────────────────────

  try { window.localStorage.clear(); } catch (e) {}
  try { window.sessionStorage.clear(); } catch (e) {}

  // ─── Passive fetch interceptor ────────────────────────────────────────
  // To actively block tracking domains, uncomment the filter inside.

  try {
    const _fetch = window.fetch;
    window.fetch = function (...args) {
      // const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      // if (/google-analytics|doubleclick|facebook\.net/.test(url)) {
      //   return Promise.resolve(new Response('', { status: 200 }));
      // }
      return _fetch.apply(this, args);
    };
  } catch (e) {}

  // ─── Passive XHR interceptor ──────────────────────────────────────────

  try {
    const _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      // if (/google-analytics|doubleclick|facebook\.net/.test(url)) url = 'about:blank';
      return _open.call(this, method, url, ...rest);
    };
  } catch (e) {}

  console.log('[Cookie Reset Pro] Page context script loaded');
})();
