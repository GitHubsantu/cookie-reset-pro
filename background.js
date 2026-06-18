/**
 * Cookie Reset Pro - Background Service Worker
 * Handles navigation events, cookie removal, and storage cleanup
 */

// Configuration and state management
const CONFIG = {
  DEBUG_MODE: false,
  BATCH_SIZE: 50,
  CLEANUP_INTERVAL: 5000
};

// Statistics tracking
const stats = {
  cookiesRemoved: 0,
  domainsCleaned: new Set(),
  storageItemsRemoved: 0,
  lastCleanup: null
};

// Extension enabled state
let isEnabled = true;

/**
 * Initialize extension on startup
 */
chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

/**
 * Install handler for first-time setup
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeExtension();
    console.log('[Cookie Reset Pro] Extension installed');
  }
});

/**
 * Initialize extension state and settings
 */
async function initializeExtension() {
  const stored = await chrome.storage.local.get(['enabled', 'debugMode', 'stats']);
  isEnabled = stored.enabled !== false;

  if (stored.debugMode !== undefined) {
    CONFIG.DEBUG_MODE = stored.debugMode;
  }

  if (stored.stats) {
    stats.cookiesRemoved = stored.stats.cookiesRemoved || 0;
    stats.storageItemsRemoved = stored.stats.storageItemsRemoved || 0;
    stats.domainsCleaned = new Set(stored.stats.domainsCleaned || []);
  }

  log('Extension initialized', { isEnabled, stats });
}

/**
 * Logging utility with debug mode control
 */
function log(message, data = null) {
  if (CONFIG.DEBUG_MODE) {
    console.log(`[Cookie Reset Pro] ${message}`, data || '');
  }
}

/**
 * Error logging utility
 */
function logError(message, error) {
  console.error(`[Cookie Reset Pro] ERROR: ${message}`, error);
}

/**
 * Listen for navigation events to clean cookies before page load
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (!isEnabled || details.frameId !== 0) return;

  try {
    const url = new URL(details.url);

    // Skip chrome://, about:, and extension URLs
    if (!url.protocol.startsWith('http')) return;

    log('Navigation detected', { url: details.url, tabId: details.tabId });

    // Remove cookies for target domain before page loads
    await removeCookiesForDomain(url.hostname);

    // Store current domain for tab
    await chrome.storage.session.set({
      [`tab_${details.tabId}_domain`]: url.hostname
    });

  } catch (error) {
    logError('Error in onBeforeNavigate', error);
  }
}, { url: [{ schemes: ['http', 'https'] }] });

/**
 * Listen for navigation commit to clean storage
 */
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (!isEnabled || details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    if (!url.protocol.startsWith('http')) return;

    log('Navigation committed', { url: details.url });

    // Inject content script cleanup
    await executeCleanupScript(details.tabId);

    // Update statistics
    stats.domainsCleaned.add(url.hostname);
    await saveStats();

  } catch (error) {
    logError('Error in onCommitted', error);
  }
}, { url: [{ schemes: ['http', 'https'] }] });

/**
 * Listen for tab updates to handle refresh scenarios
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isEnabled) return;

  if (changeInfo.status === 'loading' && tab.url) {
    try {
      const url = new URL(tab.url);
      if (!url.protocol.startsWith('http')) return;

      log('Tab loading', { tabId, url: tab.url });

      // Clean cookies on refresh (not on new navigation, that's handled by onBeforeNavigate)
      if (changeInfo.url === undefined) {
        await removeCookiesForDomain(url.hostname);
      }

    } catch (error) {
      logError('Error in onUpdated', error);
    }
  }
});

/**
 * Listen for new tab creation
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  if (!isEnabled) return;

  log('New tab created', { tabId: tab.id });

  // Clear any stored domain data for this tab
  await chrome.storage.session.remove(`tab_${tab.id}_domain`);
});

/**
 * Remove all cookies for a specific domain
 * Handles both exact domain and dot-prefix subdomain cookies
 */
async function removeCookiesForDomain(domain) {
  try {
    // Get cookies for exact domain
    const cookies = await chrome.cookies.getAll({ domain });

    // Get cookies for dot-prefix (shared subdomain cookies e.g. .example.com)
    let dotCookies = [];
    if (!domain.startsWith('.')) {
      dotCookies = await chrome.cookies.getAll({ domain: `.${domain}` });
    }

    const allCookies = [...cookies, ...dotCookies];

    if (allCookies.length === 0) {
      log('No cookies found for domain', domain);
      return;
    }

    log(`Found ${allCookies.length} cookies for ${domain}`);

    // Process cookies in batches to avoid freezing
    for (let i = 0; i < allCookies.length; i += CONFIG.BATCH_SIZE) {
      const batch = allCookies.slice(i, i + CONFIG.BATCH_SIZE);
      await Promise.all(batch.map(cookie => removeCookie(cookie)));
    }

    // FIX: Count both exact and dot-prefix cookies in stats
    stats.cookiesRemoved += allCookies.length;
    await saveStats();

    log(`Removed ${allCookies.length} cookies for ${domain}`);

  } catch (error) {
    logError(`Error removing cookies for ${domain}`, error);
  }
}

/**
 * Remove a single cookie
 */
async function removeCookie(cookie) {
  try {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;

    await chrome.cookies.remove({
      url: `${protocol}//${domain}${cookie.path}`,
      name: cookie.name,
      storeId: cookie.storeId
    });

  } catch (error) {
    logError(`Error removing cookie ${cookie.name}`, error);
  }
}

/**
 * Execute cleanup script in tab
 * FIX: Check tab exists before injecting to avoid "No tab with id" errors
 */
async function executeCleanupScript(tabId) {
  try {
    // Verify the tab still exists — it may have been closed mid-navigation
    await chrome.tabs.get(tabId);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: cleanupStorageApis,
      injectImmediately: true
    });
  } catch (error) {
    // Silently ignore errors caused by the tab being closed
    if (error.message && error.message.includes('No tab with id')) {
      log(`Tab ${tabId} was closed before cleanup could run`);
      return;
    }
    logError('Error executing cleanup script', error);
  }
}

/**
 * Function injected into tab to clean Web Storage APIs
 * Runs in the page context — keep it self-contained (no closures over outer vars)
 */
function cleanupStorageApis() {
  // Clear localStorage
  try {
    localStorage.clear();
  } catch (e) {}

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {}

  // Clear IndexedDB
  try {
    if (window.indexedDB && window.indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    }
  } catch (e) {}

  // Unregister service workers
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
  } catch (e) {}
}

/**
 * Clear all browser cookies across all sites
 */
async function clearAllCookies() {
  try {
    const allCookies = await chrome.cookies.getAll({});

    for (let i = 0; i < allCookies.length; i += CONFIG.BATCH_SIZE) {
      const batch = allCookies.slice(i, i + CONFIG.BATCH_SIZE);
      await Promise.all(batch.map(cookie => removeCookie(cookie)));
    }

    stats.cookiesRemoved += allCookies.length;
    await saveStats();

    log(`Cleared all ${allCookies.length} cookies`);
    return allCookies.length;

  } catch (error) {
    logError('Error clearing all cookies', error);
    throw error;
  }
}

/**
 * Clear all browsing data globally
 * FIX: Removed unsupported 'sessionStorage' property from dataToRemove
 */
async function clearAllStorage() {
  try {
    await chrome.browsingData.remove(
      {
        since: 0,
        originTypes: {
          protectedWeb: true,
          unprotectedWeb: true,
          extension: false
        }
      },
      {
        cache: true,
        cookies: true,
        fileSystems: true,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true
        // NOTE: 'sessionStorage' is NOT a valid browsingData type — omitted intentionally
      }
    );

    stats.storageItemsRemoved += 1;
    await saveStats();

    log('Cleared all browsing data');

  } catch (error) {
    logError('Error clearing browsing data', error);
    throw error;
  }
}

/**
 * Save statistics to persistent storage
 */
async function saveStats() {
  try {
    await chrome.storage.local.set({
      stats: {
        cookiesRemoved: stats.cookiesRemoved,
        storageItemsRemoved: stats.storageItemsRemoved,
        domainsCleaned: Array.from(stats.domainsCleaned),
        lastCleanup: new Date().toISOString()
      }
    });
  } catch (error) {
    logError('Error saving stats', error);
  }
}

/**
 * Message handler for popup communication
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {

        case 'getStatus': {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const domain = tabs[0]?.url ? new URL(tabs[0].url).hostname : 'N/A';
          sendResponse({
            enabled: isEnabled,
            domain,
            stats: {
              cookiesRemoved: stats.cookiesRemoved,
              domainsCleaned: stats.domainsCleaned.size,
              storageItemsRemoved: stats.storageItemsRemoved
            }
          });
          break;
        }

        case 'toggleEnabled': {
          isEnabled = request.value;
          await chrome.storage.local.set({ enabled: isEnabled });
          sendResponse({ success: true, enabled: isEnabled });
          break;
        }

        case 'clearCurrentSite': {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.url) {
            const url = new URL(tabs[0].url);

            // removeCookiesForDomain handles both exact + subdomain (.example.com) cookies
            await removeCookiesForDomain(url.hostname);

            // browsingData handles localStorage, IndexedDB, cache for the exact origin
            // FIX: No 'cookies' here (handled above), no 'sessionStorage' (unsupported)
            await chrome.browsingData.remove(
              { origins: [`${url.protocol}//${url.hostname}`] },
              {
                localStorage: true,
                indexedDB: true,
                cache: true
              }
            );

            await chrome.tabs.reload(tabs[0].id);
            sendResponse({ success: true });
          } else {
            sendResponse({ error: 'No active tab found' });
          }
          break;
        }

        case 'clearAllCookies': {
          const count = await clearAllCookies();
          sendResponse({ success: true, count });
          break;
        }

        case 'clearAllStorage': {
          await clearAllStorage();
          sendResponse({ success: true });
          break;
        }

        case 'setDebugMode': {
          CONFIG.DEBUG_MODE = request.value;
          await chrome.storage.local.set({ debugMode: CONFIG.DEBUG_MODE });
          sendResponse({ success: true });
          break;
        }

        case 'getLogs': {
          sendResponse({ logs: 'Check the service worker console for logs' });
          break;
        }

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      logError('Message handler error', error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Keep message channel open for async response
});

// Periodic stats save (not cleanup — cleanup only happens on navigation)
setInterval(async () => {
  if (isEnabled) {
    await saveStats();
  }
}, CONFIG.CLEANUP_INTERVAL);

log('Background service worker loaded');