/**
 * Utilities for URL analysis and feature extraction
 */
const urlUtils = {
  /**
   * Extract features from a URL for phishing detection
   * @param {string} url - URL to analyze
   * @returns {Object} Extracted features
   */
  extractUrlFeatures: (url) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Extract TLD (Top Level Domain)
      const domainParts = domain.split('.');
      const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';
      
      // Count subdomains (excluding www)
      let subdomainCount = domainParts.length - 2; // Subtract main domain and TLD
      if (subdomainCount < 0) subdomainCount = 0;
      if (domainParts[0] === 'www') subdomainCount--;
      if (subdomainCount < 0) subdomainCount = 0;
      
      // Check for IP address in hostname
      const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      const containsIpAddress = ipRegex.test(domain);
      
      // Calculate path length
      const pathLength = urlObj.pathname.length;
      
      // Check for suspicious keywords
      const suspiciousKeywords = [
        'login', 'signin', 'verify', 'secure', 'account', 'password', 
        'confirm', 'update', 'banking', 'payment', 'wallet', 'authenticate'
      ];
      
      const lowercaseUrl = url.toLowerCase();
      const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
        lowercaseUrl.includes(keyword)
      );
      
      // Check for URL shorteners
      const urlShorteners = [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 
        'cli.gs', 'ow.ly', 'ow.ly', 'su.pr', 'twurl.nl', 'snipurl.com'
      ];
      
      const isUrlShortener = urlShorteners.some(shortener => 
        domain.includes(shortener)
      );
      
      // Check for excessive subdomains
      const hasExcessiveSubdomains = subdomainCount > 3;
      
      // Check for non-standard port
      const hasNonStandardPort = 
        urlObj.port !== '' && 
        urlObj.port !== '80' && 
        urlObj.port !== '443';
      
      return {
        domain,
        tld,
        subdomainCount,
        containsIpAddress,
        pathLength,
        hasSuspiciousKeywords,
        isUrlShortener,
        hasExcessiveSubdomains,
        hasNonStandardPort
      };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return {
        domain: '',
        tld: '',
        subdomainCount: 0,
        containsIpAddress: false,
        pathLength: 0,
        hasSuspiciousKeywords: false,
        isUrlShortener: false,
        hasExcessiveSubdomains: false,
        hasNonStandardPort: false
      };
    }
  }
};

module.exports = urlUtils;