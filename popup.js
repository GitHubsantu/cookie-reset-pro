/**
 * Cookie Reset Pro - Popup Script
 * Handles user interface interactions and communication with background script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const enableToggle = document.getElementById('enableToggle');
  const toggleLabel = document.getElementById('toggleLabel');
  const currentDomain = document.getElementById('currentDomain');
  const clearCurrentSiteBtn = document.getElementById('clearCurrentSite');
  const clearAllCookiesBtn = document.getElementById('clearAllCookies');
  const clearAllStorageBtn = document.getElementById('clearAllStorage');
  const debugModeCheckbox = document.getElementById('debugMode');
  const statusMessage = document.getElementById('statusMessage');
  const cookiesRemovedEl = document.getElementById('cookiesRemoved');
  const domainsCleanedEl = document.getElementById('domainsCleaned');
  const storageRemovedEl = document.getElementById('storageRemoved');

  /**
   * Show a temporary status message in the footer
   */
  function showMessage(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message show' + (isError ? ' error' : '');

    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, 3000);
  }

  /**
   * Format large numbers for compact display
   */
  function formatNumber(num) {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * Fetch current status from background and update UI
   */
  async function updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });

      if (response.error) throw new Error(response.error);

      enableToggle.checked = response.enabled;
      toggleLabel.textContent = response.enabled ? 'Enabled' : 'Disabled';

      currentDomain.textContent = response.domain || 'N/A';

      cookiesRemovedEl.textContent = formatNumber(response.stats.cookiesRemoved);
      domainsCleanedEl.textContent = formatNumber(response.stats.domainsCleaned);
      storageRemovedEl.textContent = formatNumber(response.stats.storageItemsRemoved);

    } catch (error) {
      console.error('Error updating status:', error);
      showMessage('Error loading status', true);
    }
  }

  // ─── Toggle enable/disable ─────────────────────────────────────────────

  enableToggle.addEventListener('change', async () => {
    try {
      const enabled = enableToggle.checked;
      const response = await chrome.runtime.sendMessage({
        action: 'toggleEnabled',
        value: enabled
      });

      if (response.success) {
        toggleLabel.textContent = enabled ? 'Enabled' : 'Disabled';
        showMessage(enabled ? 'Extension enabled' : 'Extension disabled');
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
      showMessage('Error toggling extension', true);
      enableToggle.checked = !enableToggle.checked; // revert on failure
    }
  });

  // ─── Clear current site ────────────────────────────────────────────────

  clearCurrentSiteBtn.addEventListener('click', async () => {
    clearCurrentSiteBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'clearCurrentSite' });

      if (response.success) {
        showMessage('Current site cleared and reloaded');
        await updateStatus();
      } else {
        throw new Error(response.error || 'Failed to clear site');
      }
    } catch (error) {
      console.error('Error clearing current site:', error);
      showMessage('Error clearing site', true);
    } finally {
      clearCurrentSiteBtn.classList.remove('loading');
    }
  });

  // ─── Clear all cookies ─────────────────────────────────────────────────

  clearAllCookiesBtn.addEventListener('click', async () => {
    if (!confirm('Clear ALL cookies from every website? You will be logged out everywhere.')) {
      return;
    }

    clearAllCookiesBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'clearAllCookies' });

      if (response.success) {
        showMessage(`Cleared ${response.count} cookies from all sites`);
        await updateStatus();
      } else {
        throw new Error(response.error || 'Failed to clear cookies');
      }
    } catch (error) {
      console.error('Error clearing cookies:', error);
      showMessage('Error clearing cookies', true);
    } finally {
      clearAllCookiesBtn.classList.remove('loading');
    }
  });

  // ─── Clear all storage ─────────────────────────────────────────────────

  clearAllStorageBtn.addEventListener('click', async () => {
    if (!confirm('Clear ALL storage globally? This includes cache, IndexedDB, localStorage, and service workers across all sites.')) {
      return;
    }

    clearAllStorageBtn.classList.add('loading');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'clearAllStorage' });

      if (response.success) {
        showMessage('All storage cleared globally');
        await updateStatus();
      } else {
        throw new Error(response.error || 'Failed to clear storage');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      showMessage('Error clearing storage', true);
    } finally {
      clearAllStorageBtn.classList.remove('loading');
    }
  });

  // ─── Debug mode toggle ─────────────────────────────────────────────────

  debugModeCheckbox.addEventListener('change', async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'setDebugMode',
        value: debugModeCheckbox.checked
      });
      showMessage(debugModeCheckbox.checked ? 'Debug mode enabled' : 'Debug mode disabled');
    } catch (error) {
      console.error('Error setting debug mode:', error);
    }
  });

  // ─── Initialize ───────────────────────────────────────────────────────

  await updateStatus();

  // Refresh stats every 2s while popup is open
  const refreshInterval = setInterval(updateStatus, 2000);

  window.addEventListener('unload', () => {
    clearInterval(refreshInterval);
  });
});