const phishingService = require('../services/phishingService');

/**
 * Controller for phishing detection endpoints
 */
const phishingController = {
  /**
   * Analyze a URL for phishing indicators
   * @param {Object} req - Express request object with URL in body
   * @param {Object} res - Express response object
   */
  analyzeUrl: async (req, res, next) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'URL is required' 
        });
      }
      
      const result = await phishingService.analyzeUrl(url);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Analyze webpage content for phishing indicators
   * @param {Object} req - Express request object with page content
   * @param {Object} res - Express response object
   */
  analyzeContent: async (req, res, next) => {
    try {
      const { url, content, domFeatures } = req.body;
      
      if (!content) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Page content is required' 
        });
      }
      
      const result = await phishingService.analyzeContent(url, content, domFeatures);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process user feedback on detection results
   * @param {Object} req - Express request object with feedback data
   * @param {Object} res - Express response object
   */
  provideFeedback: async (req, res, next) => {
    try {
      const { url, isPhishing, userFeedback } = req.body;
      
      if (!url || userFeedback === undefined) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'URL and user feedback are required' 
        });
      }
      
      await phishingService.recordFeedback(url, isPhishing, userFeedback);
      
      return res.status(200).json({
        status: 'success',
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get statistical data about phishing detections
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getStats: async (req, res, next) => {
    try {
      const stats = await phishingService.getDetectionStats();
      
      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = phishingController;