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
    // Use your computer's IP address when running on a physical device
    // Replace 192.168.178.24 with your actual computer's IP address on your network
    return 'http://192.168.178.24:8080';
  }
};

// Fallback URLs for retry mechanism
export const API_FALLBACK_URLS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://192.168.178.24:8080', // Add your computer's IP address here too
  'http://192.168.178.24:8000'  // And with the alternate port
];

export const API_BASE_URL = getBaseApiUrl();

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
