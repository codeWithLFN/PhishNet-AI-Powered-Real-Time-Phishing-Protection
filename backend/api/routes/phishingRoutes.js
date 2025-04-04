const express = require('express');
const router = express.Router();
const phishingController = require('../../controllers/phishingController');

// Route to check URL for phishing
router.post('/analyze', phishingController.analyzeUrl);

// Route to analyze webpage content
router.post('/analyze/content', phishingController.analyzeContent);

// Route to report false positives or confirm detections
router.post('/feedback', phishingController.provideFeedback);

// Route to get phishing detection statistics
router.get('/stats', phishingController.getStats);

module.exports = router;