const api = (typeof browser !== 'undefined') ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle      = document.getElementById('enableToggle');
  const enableLabel       = document.getElementById('enableLabel');
  const autoCleanToggle   = document.getElementById('autoCleanToggle');
  const autoCleanLabel    = document.getElementById('autoCleanLabel');
  const currentDomain     = document.getElementById('currentDomain');
  const sessionBadge      = document.getElementById('sessionBadge');
  const sessionIcon       = document.getElementById('sessionIcon');
  const sessionText       = document.getElementById('sessionText');
  const cookieInfo        = document.getElementById('cookieInfo');
  const trackingCount     = document.getElementById('trackingCount');
  const sessionCount      = document.getElementById('sessionCount');
  const protectBtn        = document.getElementById('protectBtn');
  const protectBtnText    = document.getElementById('protectBtnText');
  const clearCurrentBtn   = document.getElementById('clearCurrentSite');
  const clearCookiesBtn   = document.getElementById('clearAllCookies');
  const clearStorageBtn   = document.getElementById('clearAllStorage');
  const debugCheckbox     = document.getElementById('debugMode');
  const statusMessage     = document.getElementById('statusMessage');
  const cookiesRemovedEl  = document.getElementById('cookiesRemoved');
  const trackingRemovedEl = document.getElementById('trackingRemoved');
  const domainsCleanedEl  = document.getElementById('domainsCleaned');

  let currentHostname = '';
  let currentlyManualProtected = false;

  function showMessage(msg, isError = false) {
    statusMessage.textContent = msg;
    statusMessage.className = 'status-message show' + (isError ? ' error' : '');
    setTimeout(() => statusMessage.classList.remove('show'), 3000);
  }

  function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  function setLoading(btn, on) { btn.classList.toggle('loading', on); }

  async function updateStatus() {
    try {
      const res = await api.runtime.sendMessage({ action: 'getStatus' });
      if (res.error) throw new Error(res.error);

      currentHostname = res.domain;
      currentlyManualProtected = res.manuallyProtected;

      // Toggles
      enableToggle.checked    = res.enabled;
      enableLabel.textContent = res.enabled ? 'On' : 'Off';
      autoCleanToggle.checked    = res.autoClean;
      autoCleanLabel.textContent = res.autoClean ? 'On' : 'Off';

      // Domain
      currentDomain.textContent = res.domain || 'N/A';

      // Session badge — auto-detected, no user input
      if (res.hasSession || res.manuallyProtected) {
        sessionBadge.classList.remove('hidden');
        if (res.manuallyProtected && !res.hasSession) {
          sessionIcon.textContent = '🛡️';
          sessionText.textContent = 'Manually protected';
          sessionBadge.className = 'session-badge badge-manual';
        } else {
          sessionIcon.textContent = '🔒';
          sessionText.textContent = `Logged in (${res.sessionCookieNames.slice(0,2).join(', ')}${res.sessionCookieNames.length > 2 ? '…' : ''})`;
          sessionBadge.className = 'session-badge badge-session';
        }
      } else {
        sessionBadge.classList.add('hidden');
      }

      // Cookie breakdown pills
      if (res.trackingCookieCount > 0 || res.sessionCookieNames.length > 0) {
        cookieInfo.classList.remove('hidden');
        trackingCount.textContent = `${res.trackingCookieCount} trackers`;
        sessionCount.textContent  = `${res.sessionCookieNames.length} session`;
      } else {
        cookieInfo.classList.add('hidden');
      }

      // Manual protect button — show as escape hatch
      if (currentHostname && currentHostname !== 'N/A') {
        protectBtn.classList.remove('hidden');
        if (res.manuallyProtected) {
          protectBtnText.textContent = 'Remove manual protection';
          protectBtn.className = 'protect-btn protect-active';
        } else {
          protectBtnText.textContent = 'Add manual protection';
          protectBtn.className = 'protect-btn';
        }
      } else {
        protectBtn.classList.add('hidden');
      }

      // Stats
      cookiesRemovedEl.textContent  = fmt(res.stats.cookiesRemoved);
      trackingRemovedEl.textContent = fmt(res.stats.trackingCookiesRemoved);
      domainsCleanedEl.textContent  = fmt(res.stats.domainsCleaned);

    } catch (e) {
      showMessage('Error loading status', true);
    }
  }

  enableToggle.addEventListener('change', async () => {
    try {
      const res = await api.runtime.sendMessage({ action: 'toggleEnabled', value: enableToggle.checked });
      if (res.success) {
        enableLabel.textContent = enableToggle.checked ? 'On' : 'Off';
        showMessage(enableToggle.checked ? 'Extension on' : 'Extension off');
      }
    } catch (e) {
      enableToggle.checked = !enableToggle.checked;
      showMessage('Error', true);
    }
  });

  autoCleanToggle.addEventListener('change', async () => {
    try {
      const res = await api.runtime.sendMessage({ action: 'toggleAutoClean', value: autoCleanToggle.checked });
      if (res.success) {
        autoCleanLabel.textContent = autoCleanToggle.checked ? 'On' : 'Off';
        showMessage(autoCleanToggle.checked
          ? 'Auto-clean on — logged-in sites always skipped automatically'
          : 'Auto-clean off');
      }
    } catch (e) {
      autoCleanToggle.checked = !autoCleanToggle.checked;
      showMessage('Error', true);
    }
  });

  protectBtn.addEventListener('click', async () => {
    if (!currentHostname || currentHostname === 'N/A') return;
    try {
      const res = await api.runtime.sendMessage({
        action: 'toggleManualProtect',
        domain: currentHostname
      });
      if (res.success) {
        showMessage(res.protected
          ? `${currentHostname} manually protected`
          : `Manual protection removed from ${currentHostname}`);
        await updateStatus();
      }
    } catch (e) {
      showMessage('Error', true);
    }
  });

  clearCurrentBtn.addEventListener('click', async () => {
    setLoading(clearCurrentBtn, true);
    try {
      const res = await api.runtime.sendMessage({ action: 'clearCurrentSite' });
      if (res.success) {
        showMessage('Site cleared — login session preserved');
        await updateStatus();
      } else throw new Error(res.error || 'Failed');
    } catch (e) {
      showMessage(e.message || 'Error', true);
    } finally {
      setLoading(clearCurrentBtn, false);
    }
  });

  clearCookiesBtn.addEventListener('click', async () => {
    if (!confirm('Clear ALL cookies from every website?\nYou will be logged out everywhere.')) return;
    setLoading(clearCookiesBtn, true);
    try {
      const res = await api.runtime.sendMessage({ action: 'clearAllCookies' });
      if (res.success) showMessage(`Cleared ${res.count} cookies`);
      else throw new Error(res.error);
      await updateStatus();
    } catch (e) {
      showMessage('Error', true);
    } finally { setLoading(clearCookiesBtn, false); }
  });

  clearStorageBtn.addEventListener('click', async () => {
    if (!confirm('⚠️ Nuke ALL storage globally?\n\nThis wipes everything — cache, cookies, IndexedDB — across all sites. You will be logged out everywhere.')) return;
    setLoading(clearStorageBtn, true);
    try {
      const res = await api.runtime.sendMessage({ action: 'clearAllStorage' });
      if (res.success) showMessage('All storage wiped globally');
      else throw new Error(res.error);
      await updateStatus();
    } catch (e) {
      showMessage('Error', true);
    } finally { setLoading(clearStorageBtn, false); }
  });

  debugCheckbox.addEventListener('change', async () => {
    try {
      await api.runtime.sendMessage({ action: 'setDebugMode', value: debugCheckbox.checked });
      showMessage(debugCheckbox.checked ? 'Debug on' : 'Debug off');
    } catch (e) { showMessage('Error', true); }
  });

  await updateStatus();
  const interval = setInterval(updateStatus, 2000);
  window.addEventListener('unload', () => clearInterval(interval));
});
