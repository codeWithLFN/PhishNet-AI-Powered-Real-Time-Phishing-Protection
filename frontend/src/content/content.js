/**
 * PhishNet Content Script
 * Runs in the context of web pages to analyze content and display warnings
 */

// Flag to track if we've already analyzed this page
let pageAnalyzed = false;

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContent' && !pageAnalyzed) {
    pageAnalyzed = true;
    analyzePageContent(request.url);
  }
  
  if (request.action === 'showWarning') {
    showPhishingWarning(request.data);
  }
  
  return true;
});

/**
 * Analyze the page content for phishing indicators
 * @param {string} url - Current page URL
 */
function analyzePageContent(url) {
  try {
    // Extract DOM features for analysis
    const domFeatures = extractDomFeatures();
    
    // Get the page content (HTML)
    const content = document.documentElement.outerHTML;
    
    // Send data to background script for API processing
    chrome.runtime.sendMessage({
      action: 'analyzeContent',
      data: {
        url,
        content,
        domFeatures
      }
    });
  } catch (error) {
    console.error('Error analyzing page content:', error);
  }
}

/**
 * Extract features from the DOM for phishing analysis
 * @returns {Object} DOM features for analysis
 */
function extractDomFeatures() {
  // Count form elements
  const formCount = document.forms.length;
  
  // Count password fields
  const passwordFieldCount = document.querySelectorAll('input[type="password"]').length;
  
  // Count external links
  const allLinks = document.links;
  let externalLinkCount = 0;
  const currentDomain = window.location.hostname;
  
  for (let i = 0; i < allLinks.length; i++) {
    try {
      const linkHostname = new URL(allLinks[i].href).hostname;
      if (linkHostname !== currentDomain) {
        externalLinkCount++;
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  // Count images
  const imageCount = document.images.length;
  
  // Check for login form
  const hasLoginForm = document.querySelector('form') !== null && 
    (document.querySelector('input[type="password"]') !== null || 
     document.querySelector('input[name*="pass"]') !== null ||
     document.querySelector('input[name*="login"]') !== null);
  
  // Simple check for logo-like images (not perfect but a heuristic)
  const containsLogoImages = Array.from(document.images).some(img => {
    const src = img.src.toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    return src.includes('logo') || alt.includes('logo') || 
           img.width > 100 && img.height < 100 && img.width > img.height;
  });
  
  return {
    formCount,
    passwordFieldCount,
    externalLinkCount,
    imageCount,
    hasLoginForm,
    containsLogoImages
  };
}

/**
 * Display phishing warning overlay
 * @param {Object} phishingData - Data about the detected phishing attempt
 */
function showPhishingWarning(phishingData) {
  // Check if warning is already shown
  if (document.getElementById('phishnet-warning')) {
    return;
  }
  
  // Create warning overlay
  const overlay = document.createElement('div');
  overlay.id = 'phishnet-warning';
  overlay.className = 'phishnet-overlay';
  
  // Set up warning content
  overlay.innerHTML = `
    <div class="phishnet-warning-content">
      <div class="phishnet-header">
        <img src="${chrome.runtime.getURL('/assets/icon-48.png')}" alt="PhishNet Logo">
        <h2>⚠️ Phishing Alert - Proceed with Caution</h2>
      </div>
      <div class="phishnet-body">
        <p>PhishNet has detected that this website may be a phishing attempt.</p>
        <p><strong>Risk Level:</strong> <span class="risk-${phishingData.riskLevel}">${capitalizeFirstLetter(phishingData.riskLevel)}</span></p>
        <p><strong>Confidence:</strong> ${phishingData.confidenceScore}%</p>
        
        <div class="phishnet-reasons">
          <p><strong>Reasons for detection:</strong></p>
          <ul>
            ${(phishingData.reasons || phishingData.suspiciousElements || []).map(reason => `<li>${reason}</li>`).join('')}
          </ul>
        </div>
        
        ${phishingData.possibleTargetBrand ? `<p><strong>Possible target:</strong> ${phishingData.possibleTargetBrand}</p>` : ''}
        
        <div class="phishnet-actions">
          <button id="phishnet-back" class="phishnet-btn phishnet-btn-primary">Go Back (Recommended)</button>
          <button id="phishnet-proceed" class="phishnet-btn phishnet-btn-danger">Proceed Anyway</button>
        </div>
        
        <div class="phishnet-feedback">
          <p>Was this detection correct?</p>
          <div>
            <button id="phishnet-correct" class="phishnet-feedback-btn">Yes</button>
            <button id="phishnet-incorrect" class="phishnet-feedback-btn">No</button>
          </div>
        </div>
      </div>
      <div class="phishnet-footer">
        <p>Protected by PhishNet - AI-Powered Phishing Protection</p>
      </div>
    </div>
  `;
  
  // Add the overlay to the document
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  
  // Set up event listeners for buttons
  document.getElementById('phishnet-back').addEventListener('click', () => {
    history.back();
  });
  
  document.getElementById('phishnet-proceed').addEventListener('click', () => {
    document.getElementById('phishnet-warning').remove();
    document.body.style.overflow = ''; // Restore scrolling
  });
  
  document.getElementById('phishnet-correct').addEventListener('click', () => {
    provideFeedback(true);
    document.querySelector('.phishnet-feedback').innerHTML = '<p>Thank you for your feedback!</p>';
  });
  
  document.getElementById('phishnet-incorrect').addEventListener('click', () => {
    provideFeedback(false);
    document.querySelector('.phishnet-feedback').innerHTML = '<p>Thank you for your feedback!</p>';
  });
}

/**
 * Send user feedback to the background script
 * @param {boolean} userFeedback - True if user confirms detection is correct
 */
function provideFeedback(userFeedback) {
  chrome.runtime.sendMessage({
    action: 'provideFeedback',
    data: {
      url: window.location.href,
      isPhishing: true, // If we're showing warning, system detected as phishing
      userFeedback
    }
  });
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}