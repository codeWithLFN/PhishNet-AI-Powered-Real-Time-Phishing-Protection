const admin = require('firebase-admin');

// Initialize Firebase
try {
  // If running in production, use service account credentials
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // For local development, use the application default credentials
    admin.initializeApp();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const db = admin.firestore();

/**
 * Service for Firebase interactions
 */
const firebaseService = {
  /**
   * Log URL analysis to Firestore
   * @param {string} url - The analyzed URL
   * @param {Object} analysis - Analysis results from Gemini
   */
  logUrlAnalysis: async (url, analysis) => {
    try {
      const urlDoc = {
        url,
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'url_analysis'
      };
      
      await db.collection('phishing_detections').add(urlDoc);
    } catch (error) {
      console.error('Error logging URL analysis:', error);
    }
  },

  /**
   * Log content analysis to Firestore
   * @param {string} url - The URL of the analyzed content
   * @param {Object} analysis - Analysis results from Gemini
   */
  logContentAnalysis: async (url, analysis) => {
    try {
      const contentDoc = {
        url,
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'content_analysis'
      };
      
      await db.collection('phishing_detections').add(contentDoc);
    } catch (error) {
      console.error('Error logging content analysis:', error);
    }
  },

  /**
   * Log user feedback on detection results
   * @param {string} url - The URL that was analyzed
   * @param {boolean} isPhishing - System's determination
   * @param {boolean} userFeedback - User's feedback
   */
  logUserFeedback: async (url, isPhishing, userFeedback) => {
    try {
      const feedbackDoc = {
        url,
        systemDetermination: isPhishing,
        userFeedback,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('user_feedback').add(feedbackDoc);
    } catch (error) {
      console.error('Error logging user feedback:', error);
    }
  },

  /**
   * Get phishing detection statistics
   * @returns {Object} Statistics about phishing detections
   */
  getPhishingStats: async () => {
    try {
      // Get count of phishing sites detected
      const phishingQuery = await db.collection('phishing_detections')
        .where('analysis.isPhishing', '==', true)
        .count()
        .get();
      
      const phishingCount = phishingQuery.data().count;
      
      // Get count of safe sites analyzed
      const safeQuery = await db.collection('phishing_detections')
        .where('analysis.isPhishing', '==', false)
        .count()
        .get();
      
      const safeCount = safeQuery.data().count;
      
      // Get feedback stats
      const correctFeedbackQuery = await db.collection('user_feedback')
        .where('systemDetermination', '==', 'userFeedback')
        .count()
        .get();
      
      const incorrectFeedbackQuery = await db.collection('user_feedback')
        .where('systemDetermination', '!=', 'userFeedback')
        .count()
        .get();
      
      const correctCount = correctFeedbackQuery.data().count;
      const incorrectCount = incorrectFeedbackQuery.data().count;
      
      return {
        totalAnalyzed: phishingCount + safeCount,
        phishingDetected: phishingCount,
        safeDetected: safeCount,
        userFeedback: {
          total: correctCount + incorrectCount,
          correctDetections: correctCount,
          incorrectDetections: incorrectCount,
          accuracy: correctCount / (correctCount + incorrectCount || 1)
        }
      };
    } catch (error) {
      console.error('Error fetching phishing stats:', error);
      return {
        totalAnalyzed: 0,
        phishingDetected: 0,
        safeDetected: 0,
        userFeedback: {
          total: 0,
          correctDetections: 0,
          incorrectDetections: 0,
          accuracy: 0
        }
      };
    }
  }
};

module.exports = firebaseService;