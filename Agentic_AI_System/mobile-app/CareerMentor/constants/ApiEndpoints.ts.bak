import { Platform } from 'react-native';

// API Base URL - Update this to your backend server URL
export const API_BASE_URL = 'https://evident-hyena-lately.ngrok-free.app'; // Using static ngrok domain

// Simplified fallback URLs
export const API_FALLBACK_URLS = [
  "https://evident-hyena-lately.ngrok-free.app",
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://192.168.178.24:8000', // Your actual IP address

];

export const ENDPOINTS = {
  RESUME: {
    UPLOAD: '/resumes/upload',
    ANALYZE: '/resumes/{upload_id}/layout',
    PARSE: '/resumes/{upload_id}/parse',
    EVALUATE: '/resumes/{upload_id}/evaluate',
    MATCH: '/resumes/{upload_id}/match',
  },
  JOBS: {
    SEARCH: '/jobs/search',
    MATCH: '/jobs/match',
    DETAILS: '/jobs/details',
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
