const { GoogleGenerativeAI } = require('@google/generative-ai');
const firebaseService = require('./firebaseService');
const urlUtils = require('../utils/urlUtils');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Service for phishing detection using Gemini AI
 */
const phishingService = {
  /**
   * Analyze a URL for phishing indicators using Gemini
   * @param {string} url - URL to analyze
   * @returns {Object} Analysis result
   */
  analyzeUrl: async (url) => {
    try {
      // Extract domain features
      const urlFeatures = urlUtils.extractUrlFeatures(url);
      
      // Query Gemini AI for initial URL analysis
      const prompt = `
        Analyze this URL for phishing indicators: ${url}
        
        URL characteristics:
        - Domain: ${urlFeatures.domain}
        - TLD: ${urlFeatures.tld}
        - Path length: ${urlFeatures.pathLength}
        - Number of subdomains: ${urlFeatures.subdomainCount}
        - Contains IP address: ${urlFeatures.containsIpAddress}
        - Contains suspicious keywords: ${urlFeatures.hasSuspiciousKeywords}
        
        Provide a detailed analysis of whether this URL is likely a phishing attempt.
        Return your response as a JSON object with the following structure:
        {
          "isPhishing": boolean,
          "confidenceScore": number (0-100),
          "reasons": array of strings explaining the determination,
          "riskLevel": "low", "medium", or "high"
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}') + 1;
      const jsonResponse = responseText.substring(jsonStartIndex, jsonEndIndex);
      
      const analysis = JSON.parse(jsonResponse);
      
      // Log the analysis for learning purposes
      await firebaseService.logUrlAnalysis(url, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing URL:', error);
      throw new Error('Failed to analyze URL for phishing indicators');
    }
  },

  /**
   * Analyze webpage content for phishing indicators
   * @param {string} url - URL of the webpage
   * @param {string} content - HTML content of the webpage
   * @param {Object} domFeatures - Extracted DOM features
   * @returns {Object} Analysis result
   */
  analyzeContent: async (url, content, domFeatures) => {
    try {
      // Extract key information from the content (truncate if too long)
      const truncatedContent = content.substring(0, 10000) + (content.length > 10000 ? '...' : '');
      
      // Query Gemini AI for content analysis
      const prompt = `
        Analyze this webpage content for phishing indicators. The webpage is located at: ${url}
        
        Content overview: 
        ${truncatedContent}
        
        Page characteristics:
        - Form elements: ${domFeatures.formCount || 0}
        - Password fields: ${domFeatures.passwordFieldCount || 0}
        - External links: ${domFeatures.externalLinkCount || 0}
        - Images: ${domFeatures.imageCount || 0}
        - Brand logos detected: ${domFeatures.containsLogoImages || false}
        - Login form detected: ${domFeatures.hasLoginForm || false}
        
        Based on the content and characteristics, determine if this is a phishing page.
        Consider:
        1. Does it impersonate a legitimate website?
        2. Does it ask for sensitive information in a suspicious manner?
        3. Are there inconsistencies in branding or content?
        4. Are there grammatical errors typical of phishing sites?
        
        Return your response as a JSON object with the following structure:
        {
          "isPhishing": boolean,
          "confidenceScore": number (0-100),
          "suspiciousElements": array of strings describing suspicious elements,
          "possibleTargetBrand": string (name of brand being impersonated, if any),
          "riskLevel": "low", "medium", or "high",
          "recommendation": string (action to take)
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}') + 1;
      const jsonResponse = responseText.substring(jsonStartIndex, jsonEndIndex);
      
      const analysis = JSON.parse(jsonResponse);
      
      // Log the analysis for learning purposes
      await firebaseService.logContentAnalysis(url, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze webpage content for phishing indicators');
    }
  },

  /**
   * Record user feedback on phishing detection
   * @param {string} url - URL that was analyzed
   * @param {boolean} isPhishing - Whether the system detected it as phishing
   * @param {boolean} userFeedback - User's feedback (true if user agrees it's phishing)
   */
  recordFeedback: async (url, isPhishing, userFeedback) => {
    try {
      await firebaseService.logUserFeedback(url, isPhishing, userFeedback);
      return true;
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw new Error('Failed to record user feedback');
    }
  },

  /**
   * Get statistical data about phishing detections
   * @returns {Object} Stats about detections
   */
  getDetectionStats: async () => {
    try {
      const stats = await firebaseService.getPhishingStats();
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to retrieve phishing detection statistics');
    }
  }
};

module.exports = phishingService;