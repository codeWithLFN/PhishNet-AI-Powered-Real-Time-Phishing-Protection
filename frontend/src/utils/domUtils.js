/**
 * Utility functions for DOM manipulation and feature extraction
 */

const domUtils = {
  /**
   * Extract key features from a DOM for phishing analysis
   * @returns {Object} Features extracted from the current DOM
   */
  extractDomFeatures: () => {
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
    
    // Check for possible logo images
    const containsLogoImages = Array.from(document.images).some(img => {
      const src = img.src.toLowerCase();
      const alt = (img.alt || '').toLowerCase();
      return src.includes('logo') || alt.includes('logo') || 
             img.width > 100 && img.height < 100 && img.width > img.height;
    });

    // Check for secure connection
    const isSecureConnection = window.location.protocol === 'https:';

    // Check for redirect count (information available from performance API)
    const redirectCount = performance && performance.navigation ? 
      performance.navigation.redirectCount : 0;

    // Check if there are iframes
    const iframeCount = document.querySelectorAll('iframe').length;
    
    return {
      formCount,
      passwordFieldCount,
      externalLinkCount,
      imageCount,
      hasLoginForm,
      containsLogoImages,
      isSecureConnection,
      redirectCount,
      iframeCount
    };
  },

  /**
   * Creates and injects a warning banner into the page
   * @param {Object} warningData - Data about the phishing warning
   * @param {Function} onClose - Callback when the warning is closed
   */
  createWarningBanner: (warningData, onClose) => {
    // Create banner container
    const banner = document.createElement('div');
    banner.id = 'phishnet-warning-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #ff3333;
      color: white;
      padding: 10px 20px;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 2147483647;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;

    // Create content
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    // Icon
    const icon = document.createElement('span');
    icon.innerText = '⚠️';
    icon.style.fontSize = '24px';

    // Text
    const text = document.createElement('div');
    text.innerHTML = `
      <strong>PhishNet Warning: </strong>
      <span>This site may be a phishing attempt. ${warningData.riskLevel.toUpperCase()} RISK.</span>
    `;

    // Button
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
    `;
    closeBtn.addEventListener('click', () => {
      banner.remove();
      if (onClose) onClose();
    });

    // Assemble elements
    content.appendChild(icon);
    content.appendChild(text);
    banner.appendChild(content);
    banner.appendChild(closeBtn);

    // Add to page
    document.body.prepend(banner);

    return banner;
  },

  /**
   * Capitalize the first letter of a string
   * @param {string} string - The input string
   * @returns {string} - The string with first letter capitalized
   */
  capitalizeFirstLetter: (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
};

export default domUtils;