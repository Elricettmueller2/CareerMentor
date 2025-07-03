import { Platform } from 'react-native';

// API Base URL - Update this to your backend server URL
export const API_BASE_URL = 'https://a04b-88-217-180-20.ngrok-free.app'; // Using ngrok for physical device access

// Simplified fallback URLs
export const API_FALLBACK_URLS = [
  "https://a04b-88-217-180-20.ngrok-free.app",
  "https://75c8-88-217-180-20.ngrok-free.app",
  "https://4819-88-217-180-20.ngrok-free.app",
  "https://4a91-88-217-180-20.ngrok-free.app",
  "https://3d91-88-217-180-20.ngrok-free.app",
  "https://44dd-88-217-180-20.ngrok-free.app",
  "https://ccb3-88-217-180-20.ngrok-free.app",
  "https://34d9-88-217-180-20.ngrok-free.app",
  "https://fa23-88-217-180-20.ngrok-free.app",
  "https://b421-88-217-180-20.ngrok-free.app",
  "https://a97c-88-217-180-20.ngrok-free.app",
  "https://112b-88-217-180-20.ngrok-free.app",
  "https://4f43-88-217-180-20.ngrok-free.app",
  "https://ef73-88-217-180-20.ngrok-free.app",
  "https://773c-88-217-180-20.ngrok-free.app",
  "https://fb83-88-217-180-20.ngrok-free.app",
  "https://5eba-88-217-180-20.ngrok-free.app",
  "https://f925-88-217-180-20.ngrok-free.app",
  'https://47a9-2001-a61-1117-e601-256b-16bc-10d2-1d40.ngrok-free.app',
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
