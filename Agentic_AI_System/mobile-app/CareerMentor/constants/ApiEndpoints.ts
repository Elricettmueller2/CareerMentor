import { Platform } from 'react-native';

// Determine the base URL based on platform
const getBaseApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  } else if (Platform.OS === 'ios' && !__DEV__) {
    // Production iOS
    return 'https://api.careermentor.app';
  } else if (Platform.OS === 'android' && !__DEV__) {
    // Production Android
    return 'https://api.careermentor.app';
  } else {
    // Development on physical device or emulator
    // Using ngrok tunnel for cross-network access
    return 'https://515c-2001-4ca0-0-f237-c155-66ae-8c77-635c.ngrok-free.app';
  }
};

// API Base URL - Update this to your backend server URL
export const API_BASE_URL = 'https://515c-2001-4ca0-0-f237-c155-66ae-8c77-635c.ngrok-free.app';

// Fallback URLs for retry mechanism
export const API_FALLBACK_URLS = [
  'https://515c-2001-4ca0-0-f237-c155-66ae-8c77-635c.ngrok-free.app',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://192.0.0.2:8080',    // IP address (current)
  'http://192.0.0.2:8000',    // IP with alternate port
  'http://172.20.10.14:8080', // Previous hotspot IP
  'http://172.20.10.14:8000', // Previous hotspot IP with alternate port
  'http://10.181.216.241:8080', // Previous IP address
  'http://10.181.216.241:8000', // Previous IP with alternate port
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://192.168.178.24:8080', // Keep old IP as fallback
  'http://192.168.178.24:8000'  // Keep old IP with alternate port
];

export const ENDPOINTS = {
  RESUME: {
    UPLOAD: '/resumes/upload',
    ANALYZE: '/resumes/analyze',
    FEEDBACK: '/resumes/feedback',
  },
  JOBS: {
    SEARCH: '/jobs/search',
    MATCH: '/jobs/match',
    DETAILS: '/jobs/details',
  },
};

export const API_TIMEOUT = 30000; // 30 seconds
