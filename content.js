/**
 * Cookie Reset Pro - Content Script
 * Runs at document_start to clear storage APIs before page scripts execute
 */

(function () {
  'use strict';

  const CONFIG = {
    DEBUG: false
  };

  function log(message, data) {
    if (CONFIG.DEBUG && typeof console !== 'undefined') {
      console.log(`[Cookie Reset Pro Content] ${message}`, data || '');
    }
  }

  /**
   * Clear localStorage
   */
  function clearLocalStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const count = localStorage.length;
        localStorage.clear();
        log('localStorage cleared', { items: count });
        return count;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Clear sessionStorage
   */
  function clearSessionStorage() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const count = sessionStorage.length;
        sessionStorage.clear();
        log('sessionStorage cleared', { items: count });
        return count;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Clear IndexedDB databases
   */
  function clearIndexedDB() {
    return new Promise((resolve) => {
      try {
        if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
          indexedDB.databases().then(databases => {
            let count = 0;
            databases.forEach(db => {
              try {
                if (db.name) {
                  indexedDB.deleteDatabase(db.name);
                  count++;
                  log(`IndexedDB deleted: ${db.name}`);
                }
              } catch (e) {}
            });
            resolve(count);
          }).catch(() => resolve(0));
        } else {
          resolve(0);
        }
      } catch (e) {
        resolve(0);
      }
    });
  }

  /**
   * Clear Cache API
   */
  async function clearCacheAPI() {
    try {
      if (typeof caches !== 'undefined') {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        log('Cache API cleared', { caches: cacheNames.length });
        return cacheNames.length;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Unregister service workers
   */
  async function unregisterServiceWorkers() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        log('Service workers unregistered', { count: registrations.length });
        return registrations.length;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * One-time cleanup on script load (document_start)
   */
  async function performCleanup() {
    log('Starting cleanup');

    const results = {
      localStorage: clearLocalStorage(),
      sessionStorage: clearSessionStorage(),
      indexedDB: await clearIndexedDB(),
      cacheAPI: await clearCacheAPI(),
      serviceWorkers: await unregisterServiceWorkers()
    };

    // Notify background script
    try {
      chrome.runtime.sendMessage({
        action: 'storageCleaned',
        data: results,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Extension context may not be available — safe to ignore
    }

    log('Cleanup complete', results);
  }

  /**
   * Inject injected.js into the page context via a <script src> tag.
   * Using chrome.runtime.getURL makes it CSP-safe — no inline script needed.
   * FIX: Replaced textContent injection (blocked by CSP) with src-based injection.
   */
  function injectPageContextScript() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('injected.js');
      script.onload = () => script.remove();

      const root = document.documentElement || document.head;
      if (root) {
        root.appendChild(script);
      } else {
        // documentElement not ready yet — wait for it
        const observer = new MutationObserver((_, obs) => {
          const target = document.documentElement || document.head;
          if (target) {
            target.appendChild(script);
            obs.disconnect();
          }
        });
        observer.observe(document, { childList: true });
      }
    } catch (e) {
      log('Could not inject page context script', e);
    }
  }

  /**
   * Set up cookie interception via property descriptor override.
   * Logs cookie write attempts; does not block them (would break most sites).
   * To block cookies entirely, uncomment the early return below.
   */
  function setupCookieMonitoring() {
    const cookieDesc =
      Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
      Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!cookieDesc || !cookieDesc.set) return;

    Object.defineProperty(document, 'cookie', {
      get() {
        return cookieDesc.get.call(this);
      },
      set(value) {
        log('Cookie write detected:', value);

        // Uncomment to block all cookie writes:
        // return;

        cookieDesc.set.call(this, value);

        // Ask background to delete it shortly after it is written
        setTimeout(() => {
          try {
            chrome.runtime.sendMessage({
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

  // ─── Run ────────────────────────────────────────────────────────────────────

  // Single upfront cleanup — no repeated interval (interval at 100ms broke sites)
  performCleanup();

  // Inject page-context script for tracking-variable removal
  injectPageContextScript();

  // Monitor cookie writes (log only by default — does not block)
  setupCookieMonitoring();

  // Re-run storage cleanup after DOM is ready to catch late initializations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performCleanup, { once: true });
  }

  // FIX: Removed setInterval(performCleanup, 100) — it broke React/Vue/Angular
  //      apps and caused severe performance issues. One-time cleanup is sufficient.

  // FIX: Removed storage event listener that blindly cleared all storage on
  //      every storage write — it broke authentication, carts, and preferences.

  log('Content script initialized');
})();