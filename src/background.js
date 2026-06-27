/**
 * Cookie Reset Pro - Background Script
 * Chrome MV3 + Firefox MV2
 * 
 * Smart session detection: automatically skips sites where the user
 * appears to be logged in — no domain lists, no user configuration needed.
 */

const api = (typeof browser !== 'undefined') ? browser : chrome;

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG = {
  DEBUG_MODE: false,
  BATCH_SIZE: 50,
  STATS_SAVE_INTERVAL: 5000,
  // How long a cookie must be valid to be considered a "session" cookie (7 days)
  SESSION_MIN_TTL_MS: 7 * 24 * 60 * 60 * 1000
};

// ─── Auth cookie name patterns ────────────────────────────────────────────────
// If a domain has ANY cookie matching these patterns, we treat it as logged-in
const AUTH_COOKIE_PATTERNS = [
  // Generic session identifiers
  /^sess(ion)?(_?id)?$/i,
  /^sid$/i,
  /^s_id$/i,
  /^user_?sess/i,
  /^auth/i,
  /^token$/i,
  /^access_?token/i,
  /^refresh_?token/i,
  /^id_?token/i,
  /^jwt/i,
  /^bearer/i,

  // "Remember me" / persistent login
  /^remember/i,
  /^stay_?sign/i,
  /^keep_?sign/i,
  /^persistent/i,

  // Logged-in indicators
  /^logged_?in/i,
  /^is_?auth/i,
  /^is_?logged/i,
  /^user_?id$/i,
  /^uid$/i,
  /^account_?id/i,
  /^member_?id/i,

  // Common platform-specific patterns
  /^PHPSESSID$/,          // PHP
  /^JSESSIONID$/,         // Java
  /^ASP\.NET_SessionId$/i,// ASP.NET
  /^laravel_session$/i,   // Laravel
  /^rails_.*session/i,    // Rails
  /^django_.*session/i,   // Django
  /^wordpress_logged/i,   // WordPress
  /^wp-settings/i,        // WordPress
  /^_session$/i,
  /^__session$/i,
  /^_user_session$/i,
  /^user-session$/i,

  // OAuth / SSO tokens
  /^oauth/i,
  /^sso_/i,
  /^saml/i,
  /^oidc/i,
  /^kc_/i,                // Keycloak

  // Google
  /^(SID|HSID|SSID|APISID|SAPISID|OSID|LSID)$/,
  /^__Secure-1PSID/,
  /^__Secure-3PSID/,

  // Facebook / Meta
  /^c_user$/,
  /^xs$/,
  /^datr$/,
  /^fr$/,

  // GitHub
  /^user_session$/,
  /^dotcom_user$/,
  /^logged_in$/,

  // Twitter / X
  /^auth_token$/,
  /^twid$/,

  // Microsoft
  /^ESTSAUTH/,
  /^ESTSSC/,
  /^MSPAuth/,

  // Generic "remember" patterns
  /^rm$/i,
  /^rm_tk$/i,

  // API keys / credentials that indicate active session
  /^api_?key$/i,
  /^secret$/i,
  /^credential/i
];

// ─── Tracking cookie patterns (safe to delete, never indicate login) ──────────
const TRACKING_COOKIE_PATTERNS = [
  /^_ga/,           // Google Analytics
  /^_gid/,          // Google Analytics
  /^_gat/,          // Google Analytics
  /^__utm/,         // Google Analytics (old)
  /^_fbp/,          // Facebook Pixel
  /^_fbc/,          // Facebook Click ID
  /^__gads/,        // Google Ads
  /^__gpi/,         // Google Ads
  /^_gcl/,          // Google Click ID
  /^IDE$/,          // DoubleClick
  /^NID$/,          // Google
  /^ANID$/,         // Google
  /^1P_JAR$/,       // Google
  /^CONSENT$/,      // Google consent
  /^AMP_TOKEN/,     // AMP
  /^_hjid/,         // Hotjar
  /^_hjAbsoluteSessionInProgress/, // Hotjar
  /^_hjFirstSeen/,  // Hotjar
  /^_hjTLDTest/,    // Hotjar
  /^_hjSession/,    // Hotjar
  /^_hjSessionUser/,// Hotjar
  /^ajs_/,          // Segment
  /^mixpanel/,      // Mixpanel
  /^mp_/,           // Mixpanel
  /^amplitude_/,    // Amplitude
  /^_pin_unauth/,   // Pinterest
  /^_pinterest/,    // Pinterest
  /^__qca/,         // Quantcast
  /^_scid/,         // Snapchat
  /^_ScCbts/,       // Snapchat
  /^tt_/,           // TikTok
  /^__tbc/,         // TikTok
  /^_tt_enable/,    // TikTok
  /^_uetsid/,       // Microsoft UET
  /^_uetvid/,       // Microsoft UET
  /^muid$/i,        // Microsoft
  /^MUID$/,         // Microsoft
  /^SRM_B$/,        // Microsoft
  /^anj$/,          // AppNexus
  /^uuid2$/,        // AppNexus
  /^demdex$/,       // Adobe
  /^dpm$/,          // Adobe
  /^aam_/,          // Adobe
  /^s_/,            // Adobe SiteCatalyst (short names like s_vi, s_fid)
  /^cto_/,          // Criteo
  /^__cfduid/,      // Cloudflare (old, deprecated)
  /^OptanonConsent/,// OneTrust
  /^OptanonAlertBoxClosed/, // OneTrust
  /^CookieConsent/  // Generic consent
];

// ─── In-memory state ──────────────────────────────────────────────────────────
const sessionMap = new Map();
let isEnabled  = true;
let autoClean  = false;        // OFF by default — safe default
let manualProtected = new Set(); // Domains manually protected by user via shield

const stats = {
  cookiesRemoved: 0,
  domainsCleaned: new Set(),
  storageItemsRemoved: 0,
  trackingCookiesRemoved: 0,
  lastCleanup: null
};

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(msg, data = null) {
  if (CONFIG.DEBUG_MODE) console.log(`[Cookie Reset Pro] ${msg}`, data || '');
}
function logError(msg, err) {
  console.error(`[Cookie Reset Pro] ERROR: ${msg}`, err);
}

// ─── Session detection ────────────────────────────────────────────────────────

/**
 * Check if a single cookie looks like an auth/session cookie.
 * Uses name patterns + cookie attributes (HttpOnly, long expiry).
 */
function isAuthCookie(cookie) {
  const name = cookie.name;

  // Explicit tracking cookie → definitely not auth
  if (TRACKING_COOKIE_PATTERNS.some(p => p.test(name))) return false;

  // Matches a known auth name pattern → auth
  if (AUTH_COOKIE_PATTERNS.some(p => p.test(name))) return true;

  // HttpOnly + long-lived = almost certainly a server-set session cookie
  // Tracking pixels are almost never HttpOnly
  if (cookie.httpOnly) {
    const now = Date.now() / 1000; // seconds
    if (cookie.expirationDate && (cookie.expirationDate - now) > (CONFIG.SESSION_MIN_TTL_MS / 1000)) {
      return true;
    }
    // HttpOnly with no expiry = session-scoped auth cookie (browser closes → logs out)
    if (!cookie.expirationDate) return true;
  }

  // SameSite=Strict is only used for auth cookies (tracking needs cross-site)
  if (cookie.sameSite === 'strict') return true;

  return false;
}

/**
 * Check if a domain appears to have an active login session.
 * Returns { hasSession: bool, sessionCookies: [], trackingCookies: [] }
 */
async function analyzeSessionForDomain(domain) {
  try {
    const root = getRootDomain(domain);
    const all  = await api.cookies.getAll({ domain: root });

    const sessionCookies  = [];
    const trackingCookies = [];
    const otherCookies    = [];

    for (const cookie of all) {
      if (isAuthCookie(cookie)) {
        sessionCookies.push(cookie);
      } else if (TRACKING_COOKIE_PATTERNS.some(p => p.test(cookie.name))) {
        trackingCookies.push(cookie);
      } else {
        otherCookies.push(cookie);
      }
    }

    return {
      hasSession: sessionCookies.length > 0,
      sessionCookies,
      trackingCookies,
      otherCookies,
      total: all.length
    };
  } catch (e) {
    logError(`analyzeSession(${domain})`, e);
    return { hasSession: false, sessionCookies: [], trackingCookies: [], otherCookies: [], total: 0 };
  }
}

/**
 * Master check: should we skip cleaning this domain?
 * Returns true (skip) if:
 *   - User manually protected it, OR
 *   - We detect an active login session
 */
async function shouldSkipDomain(hostname) {
  // Manual override always wins
  if (isManuallyProtected(hostname)) {
    log(`Skip (manual protection): ${hostname}`);
    return true;
  }

  const analysis = await analyzeSessionForDomain(hostname);
  if (analysis.hasSession) {
    log(`Skip (session detected): ${hostname}`, {
      sessionCookies: analysis.sessionCookies.map(c => c.name)
    });
    return true;
  }

  return false;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────
function getRootDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

function isManuallyProtected(hostname) {
  const root = getRootDomain(hostname);
  return (
    manualProtected.has(hostname) ||
    manualProtected.has(root) ||
    [...manualProtected].some(p => hostname === p || hostname.endsWith(`.${p}`))
  );
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initializeExtension() {
  try {
    const stored = await api.storage.local.get([
      'enabled', 'autoClean', 'debugMode', 'stats', 'manualProtected'
    ]);

    isEnabled = stored.enabled   !== false;
    autoClean = stored.autoClean === true;

    if (stored.debugMode !== undefined) CONFIG.DEBUG_MODE = stored.debugMode;

    if (stored.stats) {
      stats.cookiesRemoved         = stored.stats.cookiesRemoved         || 0;
      stats.storageItemsRemoved    = stored.stats.storageItemsRemoved    || 0;
      stats.trackingCookiesRemoved = stored.stats.trackingCookiesRemoved || 0;
      stats.domainsCleaned         = new Set(stored.stats.domainsCleaned || []);
    }

    manualProtected = new Set(stored.manualProtected || []);

    log('Initialized', { isEnabled, autoClean });
  } catch (e) {
    logError('initializeExtension', e);
  }
}

api.runtime.onStartup.addListener(initializeExtension);
api.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    initializeExtension();
    console.log('[Cookie Reset Pro] Installed');
  }
});

// ─── Navigation listeners ─────────────────────────────────────────────────────
api.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (!isEnabled || !autoClean || details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    if (!url.protocol.startsWith('http')) return;

    // Smart check: skip if user is logged in here
    if (await shouldSkipDomain(url.hostname)) return;

    log('Auto-clean: before navigate', url.hostname);
    await removeTrackingCookiesForDomain(url.hostname);
    sessionMap.set(`tab_${details.tabId}_domain`, url.hostname);

  } catch (e) { logError('onBeforeNavigate', e); }
}, { url: [{ schemes: ['http', 'https'] }] });

api.webNavigation.onCommitted.addListener(async (details) => {
  if (!isEnabled || !autoClean || details.frameId !== 0) return;

  try {
    const url = new URL(details.url);
    if (!url.protocol.startsWith('http')) return;

    if (await shouldSkipDomain(url.hostname)) return;

    await executeCleanupScript(details.tabId);
    stats.domainsCleaned.add(url.hostname);
    await saveStats();

  } catch (e) { logError('onCommitted', e); }
}, { url: [{ schemes: ['http', 'https'] }] });

api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isEnabled || !autoClean) return;
  if (changeInfo.status === 'loading' && tab.url && changeInfo.url === undefined) {
    try {
      const url = new URL(tab.url);
      if (!url.protocol.startsWith('http')) return;
      if (await shouldSkipDomain(url.hostname)) return;
      await removeTrackingCookiesForDomain(url.hostname);
    } catch (e) { logError('onUpdated', e); }
  }
});

api.tabs.onCreated.addListener((tab) => {
  sessionMap.delete(`tab_${tab.id}_domain`);
});

// ─── Smart cookie removal ─────────────────────────────────────────────────────

/**
 * Remove ONLY tracking cookies for a domain — never auth cookies.
 * Used by auto-clean (navigation-triggered).
 */
async function removeTrackingCookiesForDomain(domain) {
  try {
    const root = getRootDomain(domain);
    const all  = await api.cookies.getAll({ domain: root });

    const toRemove = all.filter(c =>
      !isAuthCookie(c) &&
      TRACKING_COOKIE_PATTERNS.some(p => p.test(c.name))
    );

    if (toRemove.length === 0) { log('No tracking cookies for', domain); return; }

    for (let i = 0; i < toRemove.length; i += CONFIG.BATCH_SIZE) {
      await Promise.all(toRemove.slice(i, i + CONFIG.BATCH_SIZE).map(removeCookie));
    }

    stats.cookiesRemoved         += toRemove.length;
    stats.trackingCookiesRemoved += toRemove.length;
    await saveStats();
    log(`Removed ${toRemove.length} tracking cookies for ${domain}`);
  } catch (e) {
    logError(`removeTrackingCookies(${domain})`, e);
  }
}

/**
 * Remove ALL non-auth cookies for a domain.
 * Used by manual "Clear Current Site" — more aggressive but still safe.
 */
async function removeNonAuthCookiesForDomain(domain) {
  try {
    const root = getRootDomain(domain);
    const all  = await api.cookies.getAll({ domain: root });

    // Keep auth cookies, remove everything else
    const toRemove = all.filter(c => !isAuthCookie(c));
    const kept     = all.filter(c =>  isAuthCookie(c));

    log(`${domain}: removing ${toRemove.length}, keeping ${kept.length} auth cookies`, {
      kept: kept.map(c => c.name)
    });

    for (let i = 0; i < toRemove.length; i += CONFIG.BATCH_SIZE) {
      await Promise.all(toRemove.slice(i, i + CONFIG.BATCH_SIZE).map(removeCookie));
    }

    stats.cookiesRemoved += toRemove.length;
    await saveStats();
    return { removed: toRemove.length, kept: kept.length };
  } catch (e) {
    logError(`removeNonAuthCookies(${domain})`, e);
    return { removed: 0, kept: 0 };
  }
}

/**
 * Remove ALL cookies including auth — for explicit full wipe.
 */
async function removeCookiesForDomain(domain) {
  try {
    const root   = getRootDomain(domain);
    const exact  = await api.cookies.getAll({ domain: root });
    const dotted = await api.cookies.getAll({ domain: `.${root}` });
    const all    = [...new Map([...exact, ...dotted].map(c => [c.name + c.domain, c])).values()];

    for (let i = 0; i < all.length; i += CONFIG.BATCH_SIZE) {
      await Promise.all(all.slice(i, i + CONFIG.BATCH_SIZE).map(removeCookie));
    }

    stats.cookiesRemoved += all.length;
    await saveStats();
    return all.length;
  } catch (e) {
    logError(`removeCookiesForDomain(${domain})`, e);
    return 0;
  }
}

async function removeCookie(cookie) {
  try {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const domain   = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    await api.cookies.remove({
      url: `${protocol}//${domain}${cookie.path}`,
      name: cookie.name,
      storeId: cookie.storeId
    });
  } catch (e) { /* individual cookie errors are silent */ }
}

// ─── Script injection ─────────────────────────────────────────────────────────
async function executeCleanupScript(tabId) {
  try {
    await api.tabs.get(tabId);
    if (api.scripting) {
      await api.scripting.executeScript({
        target: { tabId },
        func: cleanupStorageApis,
        injectImmediately: true
      });
    } else {
      await api.tabs.executeScript(tabId, {
        code: `(${cleanupStorageApis.toString()})()`,
        runAt: 'document_start'
      });
    }
  } catch (e) {
    if (e.message?.includes('No tab with id')) return;
    logError('executeCleanupScript', e);
  }
}

function cleanupStorageApis() {
  try { localStorage.clear();   } catch (e) {}
  try { sessionStorage.clear(); } catch (e) {}
  try {
    if (window.indexedDB?.databases) {
      indexedDB.databases().then(dbs =>
        dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name))
      );
    }
  } catch (e) {}
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs =>
        regs.forEach(r => r.unregister())
      );
    }
  } catch (e) {}
}

// ─── Clear current site (manual) ─────────────────────────────────────────────
async function clearCurrentSite(url) {
  const hostname = url.hostname;
  const origin   = `${url.protocol}//${hostname}`;
  const errors   = [];

  // Remove non-auth cookies only — session is preserved automatically
  try {
    await removeNonAuthCookiesForDomain(hostname);
  } catch (e) {
    errors.push(`cookies: ${e.message}`);
  }

  // Clear storage for this origin only
  try {
    await api.browsingData.remove(
      { origins: [origin] },
      { localStorage: true, indexedDB: true, cache: true }
    );
  } catch (e) {
    try {
      const root = getRootDomain(hostname);
      await Promise.allSettled([
        `https://${hostname}`, `http://${hostname}`,
        `https://${root}`,    `http://${root}`
      ].map(o => api.browsingData.remove(
        { origins: [o] },
        { localStorage: true, indexedDB: true, cache: true }
      )));
    } catch (e2) {
      errors.push(`storage: ${e2.message}`);
    }
  }

  // Inject script to clear sessionStorage in the tab
  try {
    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) await executeCleanupScript(tabs[0].id);
  } catch (e) {
    errors.push(`script: ${e.message}`);
  }

  if (errors.length >= 3) throw new Error('All methods failed: ' + errors.join('; '));
}

// ─── Clear all cookies ────────────────────────────────────────────────────────
async function clearAllCookies() {
  const all = await api.cookies.getAll({});
  for (let i = 0; i < all.length; i += CONFIG.BATCH_SIZE) {
    await Promise.all(all.slice(i, i + CONFIG.BATCH_SIZE).map(removeCookie));
  }
  stats.cookiesRemoved += all.length;
  await saveStats();
  return all.length;
}

// ─── Clear all storage ────────────────────────────────────────────────────────
async function clearAllStorage() {
  const isFirefox = typeof browser !== 'undefined';
  await api.browsingData.remove(
    { since: 0, originTypes: { protectedWeb: true, unprotectedWeb: true, extension: false } },
    {
      cache: true, cookies: true, indexedDB: true,
      localStorage: true, serviceWorkers: true,
      ...(isFirefox ? {} : { fileSystems: true, webSQL: true })
    }
  );
  stats.storageItemsRemoved += 1;
  await saveStats();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
async function saveStats() {
  try {
    await api.storage.local.set({
      stats: {
        cookiesRemoved:         stats.cookiesRemoved,
        storageItemsRemoved:    stats.storageItemsRemoved,
        trackingCookiesRemoved: stats.trackingCookiesRemoved,
        domainsCleaned:         Array.from(stats.domainsCleaned),
        lastCleanup:            new Date().toISOString()
      }
    });
  } catch (e) { logError('saveStats', e); }
}

// ─── Message handler ──────────────────────────────────────────────────────────
api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {

        case 'getStatus': {
          const tabs     = await api.tabs.query({ active: true, currentWindow: true });
          const hostname = tabs[0]?.url ? new URL(tabs[0].url).hostname : 'N/A';
          const analysis = hostname !== 'N/A' ? await analyzeSessionForDomain(hostname) : null;
          sendResponse({
            enabled:   isEnabled,
            autoClean,
            domain:    hostname,
            hasSession:   analysis?.hasSession   ?? false,
            sessionCookieNames: analysis?.sessionCookies.map(c => c.name) ?? [],
            trackingCookieCount: analysis?.trackingCookies.length ?? 0,
            manuallyProtected: isManuallyProtected(hostname),
            stats: {
              cookiesRemoved:         stats.cookiesRemoved,
              domainsCleaned:         stats.domainsCleaned.size,
              storageItemsRemoved:    stats.storageItemsRemoved,
              trackingCookiesRemoved: stats.trackingCookiesRemoved
            }
          });
          break;
        }

        case 'toggleEnabled': {
          isEnabled = request.value;
          await api.storage.local.set({ enabled: isEnabled });
          sendResponse({ success: true, enabled: isEnabled });
          break;
        }

        case 'toggleAutoClean': {
          autoClean = request.value;
          await api.storage.local.set({ autoClean });
          sendResponse({ success: true, autoClean });
          break;
        }

        case 'toggleManualProtect': {
          const d = request.domain;
          if (manualProtected.has(d)) {
            manualProtected.delete(d);
          } else {
            manualProtected.add(d);
          }
          await api.storage.local.set({ manualProtected: [...manualProtected] });
          sendResponse({ success: true, protected: manualProtected.has(d) });
          break;
        }

        case 'clearCurrentSite': {
          const tabs = await api.tabs.query({ active: true, currentWindow: true });
          if (!tabs[0]?.url) { sendResponse({ error: 'No active tab' }); break; }
          const url = new URL(tabs[0].url);
          if (!url.protocol.startsWith('http')) {
            sendResponse({ error: 'Not an http/https page' }); break;
          }
          try {
            await clearCurrentSite(url);
          } catch (e) {
            sendResponse({ error: e.message }); break;
          }
          try { await api.tabs.reload(tabs[0].id); } catch (e) {}
          sendResponse({ success: true });
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
          await api.storage.local.set({ debugMode: CONFIG.DEBUG_MODE });
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (e) {
      logError('Message handler', e);
      sendResponse({ error: e.message });
    }
  })();
  return true;
});

setInterval(() => { if (isEnabled) saveStats(); }, CONFIG.STATS_SAVE_INTERVAL);
log('Background loaded');
