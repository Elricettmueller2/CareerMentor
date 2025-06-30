import { Platform } from 'react-native';

// Determine the base URL based on platform
const getBaseApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  } else if (Platform.OS === 'ios' && !__DEV__) {
    // Production iOS
    return 'https://api.careermentor.app';
  } else if (Platform.OS === 'android' && !__DEV__) {
    // Production Android
    return 'https://api.careermentor.app';
  } else {
    // Development on physical device or emulator
    // Using ngrok tunnel for cross-network access
    return 'https://0716-2001-a61-1117-e601-a90c-9022-3de0-e991.ngrok-free.app';
  }
};

// API Base URL - Update this to your backend server URL
export const API_BASE_URL = 'https://0716-2001-a61-1117-e601-a90c-9022-3de0-e991.ngrok-free.app'; // Using ngrok for physical device access

// Simplified fallback URLs
export const API_FALLBACK_URLS = [
  'https://0716-2001-a61-1117-e601-a90c-9022-3de0-e991.ngrok-free.app',
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
