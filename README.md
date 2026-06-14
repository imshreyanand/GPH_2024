# Police Assistant

An AI-powered multilingual Police Assistant application built with Next.js and Node.js. It leverages Google's Gemini, AI4Bharat's Bhashini, and ChatPDF APIs to provide a seamless conversational interface that supports voice interactions in multiple Indian languages, handles file uploads, and enables querying of police procedure documents.

## Features

- **Multilingual Support:** Communicate in over 15 regional languages including Kannada, Tamil, Telugu, Hindi, and more.
- **Voice Recognition & TTS:** Voice note recording, automatic translation to English for processing, and text-to-speech generation back into the user's native language.
- **AI Chatbot:** Powered by Gemini 1.5 Flash for intelligent context-aware responses.
- **Document Question & Answering:** Integrates ChatPDF to allow querying of official procedures or PDFs directly.
- **Anonymous Reporting:** Dedicated module to submit anonymous tips and report issues safely.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, Multer
- **AI Integrations:** 
  - Google Generative AI (Gemini)
  - AI4Bharat (Speech-to-Text, Translation, Text-to-Speech)
  - ChatPDF API

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/imshreyanand/GPH_2024.git
cd GPH_2024
```

### 2. Backend Setup
```bash
cd backend
npm install
# Start the backend server
npm start
```
The server will run on `http://localhost:5000`. Ensure you add your API keys directly into `index.js` or manage them securely.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Start the Next.js development server
npm run dev
```
Access the application by navigating to `http://localhost:3000` in your browser.
