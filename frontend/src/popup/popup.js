/**
 * PhishNet Popup Script
 * Handles the popup UI interactions and displays the current protection status
 */

// DOM elements
const protectionToggle = document.getElementById('protection-toggle');
const notificationsToggle = document.getElementById('notifications-toggle');
const autoscanToggle = document.getElementById('autoscan-toggle');
const statusIndicator = document.getElementById('status-indicator');
const statusIcon = statusIndicator.querySelector('.status-icon');
const statusText = statusIndicator.querySelector('.status-text');
const threatsBlocked = document.getElementById('threats-blocked');
const sitesScanned = document.getElementById('sites-scanned');
const viewStatsBtn = document.getElementById('view-stats-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const siteStatus = document.getElementById('site-status');
const protectionLevels = document.querySelectorAll('input[name="level"]');

// API endpoint
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings from storage
  chrome.storage.sync.get(
    ['enabled', 'notificationsEnabled', 'detectionLevel', 'stats'],
    (result) => {
      // Set toggle states
      protectionToggle.checked = result.enabled;
      notificationsToggle.checked = result.notificationsEnabled;
      
      // Update UI based on enabled state
      updateProtectionStatus(result.enabled);
      
      // Set protection level
      if (result.detectionLevel) {
        document.querySelector(`input[value="${result.detectionLevel}"]`).checked = true;
      }
      
      // Display stats
      if (result.stats) {
        threatsBlocked.textContent = result.stats.threatsBlocked || '0';
        sitesScanned.textContent = result.stats.sitesScanned || '0';
      }
    }
  );
  
  // Check current tab
  await checkCurrentSite();
  
  // Get updated stats from the API
  fetchStats();
});

// Toggle protection on/off
protectionToggle.addEventListener('change', () => {
  const enabled = protectionToggle.checked;
  
  // Save to storage
  chrome.storage.sync.set({ enabled });
  
  // Update UI
  updateProtectionStatus(enabled);
});

// Toggle notifications
notificationsToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ notificationsEnabled: notificationsToggle.checked });
});

// Toggle auto-scan
autoscanToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ autoscanEnabled: autoscanToggle.checked });
});

// Change protection level
protectionLevels.forEach(level => {
  level.addEventListener('change', () => {
    if (level.checked) {
      chrome.storage.sync.set({ detectionLevel: level.value });
    }
  });
});

// View stats button
viewStatsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/stats.html` });
});

/**
 * Update UI to reflect current protection status
 * @param {boolean} enabled - Whether protection is enabled
 */
function updateProtectionStatus(enabled) {
  if (enabled) {
    statusIcon.classList.add('active');
    statusText.textContent = 'Protection Active';
    statusIndicator.style.opacity = '1';
  } else {
    statusIcon.classList.remove('active');
    statusText.textContent = 'Protection Disabled';
    statusIndicator.style.opacity = '0.5';
  }
}

/**
 * Check the phishing status of the current site
 */
async function checkCurrentSite() {
  try {
    // Get current tab URL
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    // Skip non-HTTP URLs
    if (!currentTab.url || 
        currentTab.url.startsWith('chrome://') || 
        currentTab.url.startsWith('chrome-extension://') || 
        currentTab.url.startsWith('file://')) {
      siteStatus.innerHTML = `<p>PhishNet doesn't scan browser pages.</p>`;
      loadingSpinner.style.display = 'none';
      return;
    }
    
    // Check if URL has been analyzed
    const response = await fetch(`${API_BASE_URL}/phishing/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: currentTab.url })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze site');
    }
    
    const data = await response.json();
    const result = data.data;
    
    // Update UI with result
    loadingSpinner.style.display = 'none';
    
    if (result.isPhishing) {
      siteStatus.innerHTML = `
        <div class="site-warning">
          <p>⚠️ <strong>Warning:</strong> This site appears to be a phishing attempt!</p>
          <p>Risk Level: <span class="risk-${result.riskLevel}">${capitalizeFirstLetter(result.riskLevel)}</span></p>
          <p>Confidence: ${result.confidenceScore}%</p>
        </div>
      `;
    } else {
      siteStatus.innerHTML = `
        <div class="site-safe">
          <p>✅ This site appears to be safe.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error checking site:', error);
    loadingSpinner.style.display = 'none';
    siteStatus.innerHTML = `<p>Could not analyze current site.</p>`;
  }
}

/**
 * Fetch statistics from the API
 */
async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/phishing/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    const data = await response.json();
    const stats = data.data;
    
    // Update the displayed stats
    threatsBlocked.textContent = stats.phishingDetected || '0';
    sitesScanned.textContent = stats.totalAnalyzed || '0';
    
    // Save to storage for future reference
    chrome.storage.sync.set({
      stats: {
        threatsBlocked: stats.phishingDetected,
        sitesScanned: stats.totalAnalyzed
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}