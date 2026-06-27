/**
 * Cookie Reset Pro - Content Script
 * Shared for Chrome and Firefox.
 * Runs at document_start. On Firefox the polyfill is loaded before this file.
 */

(function () {
  'use strict';

  const api = (typeof browser !== 'undefined') ? browser : chrome;

  const CONFIG = { DEBUG: false };

  function log(msg, data) {
    if (CONFIG.DEBUG) console.log(`[Cookie Reset Pro Content] ${msg}`, data || '');
  }

  // ─── Storage cleanup ────────────────────────────────────────────────────

  function clearLocalStorage() {
    try {
      const count = localStorage.length;
      localStorage.clear();
      log('localStorage cleared', count);
      return count;
    } catch (e) { return 0; }
  }

  function clearSessionStorage() {
    try {
      const count = sessionStorage.length;
      sessionStorage.clear();
      log('sessionStorage cleared', count);
      return count;
    } catch (e) { return 0; }
  }

  function clearIndexedDB() {
    return new Promise(resolve => {
      try {
        if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
          indexedDB.databases().then(dbs => {
            dbs.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name); });
            resolve(dbs.length);
          }).catch(() => resolve(0));
        } else {
          resolve(0);
        }
      } catch (e) { resolve(0); }
    });
  }

  async function clearCacheAPI() {
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        return keys.length;
      }
    } catch (e) {}
    return 0;
  }

  async function unregisterServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        return regs.length;
      }
    } catch (e) {}
    return 0;
  }

  // ─── One-time cleanup ───────────────────────────────────────────────────

  async function performCleanup() {
    log('Cleanup start');
    const results = {
      localStorage: clearLocalStorage(),
      sessionStorage: clearSessionStorage(),
      indexedDB: await clearIndexedDB(),
      cacheAPI: await clearCacheAPI(),
      serviceWorkers: await unregisterServiceWorkers()
    };

    try {
      api.runtime.sendMessage({
        action: 'storageCleaned',
        data: results,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}

    log('Cleanup done', results);
  }

  // ─── Inject page-context script (CSP-safe via src, not textContent) ─────

  function injectPageContextScript() {
    try {
      const script = document.createElement('script');
      script.src = api.runtime.getURL('injected.js');
      script.onload = () => script.remove();

      const root = document.documentElement || document.head;
      if (root) {
        root.appendChild(script);
      } else {
        const obs = new MutationObserver((_, o) => {
          const target = document.documentElement || document.head;
          if (target) { target.appendChild(script); o.disconnect(); }
        });
        obs.observe(document, { childList: true });
      }
    } catch (e) {
      log('Could not inject page context script', e);
    }
  }

  // ─── Cookie write monitoring (log-only; does not block) ─────────────────

  function setupCookieMonitoring() {
    const desc =
      Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!desc || !desc.set) return;

    Object.defineProperty(document, 'cookie', {
      get() { return desc.get.call(this); },
      set(value) {
        log('Cookie write:', value);
        desc.set.call(this, value);
        // Notify background to delete it shortly after
        setTimeout(() => {
          try {
            api.runtime.sendMessage({
              action: 'removeCookie',
              cookieString: value,
              domain: window.location.hostname
            });
          } catch (e) {}
        }, 150);
      },
      configurable: true
    });
  }

  // ─── Run ────────────────────────────────────────────────────────────────

  performCleanup();
  injectPageContextScript();
  setupCookieMonitoring();

  // Second pass after DOM is ready (catches late initializations)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performCleanup, { once: true });
  }

  // No setInterval — it broke React/Vue/Angular apps at 100ms

  log('Content script ready');
})();
