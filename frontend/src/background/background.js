/**
 * PhishNet Background Script
 * Handles URL monitoring and communication with the backend service
 */

// API endpoint configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Cache for analyzed URLs to avoid repeated API calls
const urlCache = new Map();

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('PhishNet extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    notificationsEnabled: true,
    detectionLevel: 'medium' // Options: 'low', 'medium', 'high'
  });
});

// Listen for tab updates to analyze new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only analyze when the page has finished loading
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip extension pages, local files, etc.
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('file://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    // Check if extension is enabled
    chrome.storage.sync.get(['enabled'], (result) => {
      if (result.enabled) {
        analyzeUrl(tab.url, tabId);
      }
    });
  }
});

/**
 * Analyze a URL for phishing indicators using the backend API
 * @param {string} url - URL to analyze
 * @param {number} tabId - Browser tab ID
 */
async function analyzeUrl(url, tabId) {
  try {
    // Check cache first
    if (urlCache.has(url)) {
      const cachedResult = urlCache.get(url);
      if (cachedResult.isPhishing) {
        showPhishingAlert(tabId, cachedResult);
      }
      return;
    }
    
    // Call the backend API
    const response = await fetch(`${API_BASE_URL}/phishing/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the result (with expiration)
    urlCache.set(url, data.data);
    setTimeout(() => urlCache.delete(url), 3600000); // Cache for 1 hour
    
    // If phishing detected, show alert
    if (data.data.isPhishing) {
      showPhishingAlert(tabId, data.data);
      
      // Also analyze the content to improve detection
      chrome.tabs.sendMessage(tabId, { 
        action: 'analyzeContent',
        url: url
      });
    }
  } catch (error) {
    console.error('Error analyzing URL:', error);
  }
}

/**
 * Show phishing alert to the user
 * @param {number} tabId - Browser tab ID
 * @param {Object} phishingData - Detection data
 */
function showPhishingAlert(tabId, phishingData) {
  // Send message to content script to show warning
  chrome.tabs.sendMessage(tabId, { 
    action: 'showWarning',
    data: phishingData
  });
  
  // Change the extension icon to indicate risk
  chrome.action.setIcon({
    path: {
      16: '/assets/warning-icon-16.png',
      48: '/assets/warning-icon-48.png',
      128: '/assets/warning-icon-128.png'
    },
    tabId: tabId
  });
  
  // Show a browser notification if enabled
  chrome.storage.sync.get(['notificationsEnabled'], (result) => {
    if (result.notificationsEnabled) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/warning-icon-128.png',
        title: 'PhishNet Protection Alert',
        message: `Warning: Possible phishing site detected with ${phishingData.confidenceScore}% confidence.`,
        priority: 2
      });
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent') {
    // Call the backend API to analyze content
    fetch(`${API_BASE_URL}/phishing/analyze/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data)
    })
    .then(response => response.json())
    .then(data => {
      if (data.data.isPhishing) {
        showPhishingAlert(sender.tab.id, data.data);
      }
      sendResponse({ status: 'success', data: data.data });
    })
    .catch(error => {
      console.error('Error analyzing content:', error);
      sendResponse({ status: 'error', message: error.message });
    });
    
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'provideFeedback') {
    // Send user feedback to backend
    fetch(`${API_BASE_URL}/phishing/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data)
    })
    .then(() => {
      sendResponse({ status: 'success' });
    })
    .catch(error => {
      console.error('Error sending feedback:', error);
      sendResponse({ status: 'error', message: error.message });
    });
    
    return true; // Keep the message channel open for async response
  }
});