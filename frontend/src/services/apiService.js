/**
 * PhishNet API Service
 * Handles communication with the backend API
 */

// API Base URL - can be configured based on environment
const API_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Service for interacting with the PhishNet API
 */
const apiService = {
  /**
   * Analyze a URL for phishing indicators
   * @param {string} url - URL to analyze
   * @returns {Promise<Object>} Analysis result
   */
  analyzeUrl: async (url) => {
    try {
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
      return data.data;
    } catch (error) {
      console.error('Error analyzing URL:', error);
      throw error;
    }
  },

  /**
   * Analyze webpage content for phishing indicators
   * @param {string} url - URL of the webpage
   * @param {string} content - HTML content of the webpage
   * @param {Object} domFeatures - Extracted DOM features
   * @returns {Promise<Object>} Analysis result
   */
  analyzeContent: async (url, content, domFeatures) => {
    try {
      const response = await fetch(`${API_BASE_URL}/phishing/analyze/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, content, domFeatures })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw error;
    }
  },

  /**
   * Submit user feedback on phishing detection
   * @param {string} url - URL that was analyzed
   * @param {boolean} isPhishing - Whether system detected as phishing
   * @param {boolean} userFeedback - User's feedback (true if agrees it's phishing)
   * @returns {Promise<Object>} Response
   */
  submitFeedback: async (url, isPhishing, userFeedback) => {
    try {
      const response = await fetch(`${API_BASE_URL}/phishing/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, isPhishing, userFeedback })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Get phishing detection statistics
   * @returns {Promise<Object>} Stats data
   */
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/phishing/stats`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export default apiService;