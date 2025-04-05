# PhishNet: AI-Powered Real-Time Phishing Protection

PhishNet is a browser extension and backend service that uses Google's Gemini AI to provide real-time protection against phishing attacks by analyzing URLs and webpage content.

## Features

- **Real-time URL Analysis**: Analyzes URLs before you visit them
- **Content-based Detection**: Evaluates webpage content to detect phishing attempts
- **AI-Powered Analysis**: Leverages Google Gemini AI for sophisticated detection
- **User-friendly Warnings**: Clear alerts when phishing is detected
- **Customizable Protection**: Adjustable protection levels
- **Feedback System**: Users can report false positives/negatives

## Project Structure

The project is divided into two main components:

### Frontend (Browser Extension)

- User interface for the browser extension
- Real-time scanning of webpages
- Warning displays for detected threats

### Backend (Express.js Server)

- API endpoints for phishing analysis
- Google Gemini AI integration
- Firebase data storage for analysis results

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Google Chrome or compatible browser
- Google Gemini API key
- Firebase project (optional, for storing analytics)

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a .env file based on .env.example and add your Gemini API key:

   ```bash
   cp .env.example .env
   # Edit the .env file to add your credentials
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load the extension in your browser:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder from the frontend directory

## Usage

1. The PhishNet icon will appear in your browser toolbar
2. Click the icon to access settings and view protection status
3. Browse the web normally - PhishNet will alert you when it detects a potential phishing site
4. Provide feedback on detections to help improve the system

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

This will watch for changes and rebuild the extension automatically.

### Backend Development

```bash
cd backend
npm run dev
```

This will start the server with nodemon for auto-reloading.

## Technologies Used

- **Frontend**: JavaScript, Chrome Extension API
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini AI
- **Database**: Firebase Firestore
- **Build Tools**: Webpack, Babel

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for powering the detection engine
- Firebase for data storage capabilities
