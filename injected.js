/**
 * Cookie Reset Pro - Injected Script
 * Runs in page context (not extension context) for deeper access.
 * Loaded via <script src="..."> so it is CSP-safe.
 */

(function () {
  'use strict';

  // ─── Clear common tracking global variables ──────────────────────────────

  const trackingVars = [
    '_ga', '_gid', '_gat',
    '__utma', '__utmb', '__utmc', '__utmz',
    '_fbp', 'fbq',
    'dataLayer', 'gtag', 'gaData', 'gaGlobal',
    'optimizely',
    'amplitude',
    'mixpanel',
    'segment',
    'analytics',
    'trackjs',
    'bugsnag',
    'sentry'
  ];

  trackingVars.forEach(varName => {
    try {
      if (window[varName] !== undefined) {
        delete window[varName];
      }
    } catch (e) {}
  });

  // ─── Clear Web Storage ───────────────────────────────────────────────────

  try {
    window.localStorage.clear();
  } catch (e) {}

  try {
    window.sessionStorage.clear();
  } catch (e) {}

  // ─── Clear known state variables set by common frameworks ───────────────

  const stateVars = [
    '__INITIAL_STATE__',
    '__REDUX_STATE__',
    '__NEXT_DATA__',
    '__NUXT__',
    '__DATA__',
    '__APP_STATE__'
  ];

  stateVars.forEach(varName => {
    try {
      if (window[varName] !== undefined) {
        delete window[varName];
      }
    } catch (e) {}
  });

  // ─── Override fetch to intercept tracking requests (passive) ────────────
  // Currently logs only. To block specific tracking endpoints,
  // add URL pattern checks inside and return early.

  try {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      // Example block (uncomment to activate):
      // const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      // if (url && /google-analytics|doubleclick|facebook\.net/.test(url)) {
      //   return Promise.resolve(new Response('', { status: 200 }));
      // }
      return originalFetch.apply(this, args);
    };
  } catch (e) {}

  // ─── Override XMLHttpRequest to intercept tracking requests (passive) ────

  try {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      // Example block (uncomment to activate):
      // if (/google-analytics|doubleclick|facebook\.net/.test(url)) {
      //   url = 'about:blank';
      // }
      return originalOpen.call(this, method, url, ...rest);
    };
  } catch (e) {}

  console.log('[Cookie Reset Pro] Page context script loaded');
})();