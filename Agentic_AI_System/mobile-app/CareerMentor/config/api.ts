// API configuration for the CareerMentor app
// This file centralizes all API URLs and can be easily updated for different environments
import { Platform } from 'react-native';

// Base URLs for different environments
export const API_BASE_URLS = {
  // For iOS simulator or web
  localhost: 'http://localhost:8000',
  
  // For Android emulator
  emulator: 'http://10.0.2.2:8000',
  
  // For Docker container access
  docker: 'http://host.docker.internal:8000',
  
  // For physical devices (adjust IP to your computer's IP)
  device: 'http://192.168.178.29:8000',
  
  // Fallback to localhost with standard port
  fallback: 'http://127.0.0.1:8000'
};

// Select appropriate base URL based on platform
const getPlatformDefaultUrl = () => {
  if (Platform.OS === 'web') {
    return API_BASE_URLS.localhost;
  } else if (Platform.OS === 'android') {
    return API_BASE_URLS.emulator;
  } else if (Platform.OS === 'ios') {
    return API_BASE_URLS.localhost;
  } else {
    return API_BASE_URLS.fallback;
  }
};

// Default API base URL based on platform
export const DEFAULT_API_BASE_URL = getPlatformDefaultUrl();

// API endpoints for different services
export const API_ENDPOINTS = {
  // Path Finder endpoints
  pathFinder: {
    search: '/agents/path_finder/search_jobs_online',
    savedJobs: '/agents/path_finder/saved_jobs',
    recommendJobs: '/agents/path_finder/recommend',
    saveJob: '/agents/path_finder/save_job',
    unsaveJob: '/agents/path_finder/unsave_job',
    jobDetails: '/agents/path_finder/job'
  },
  
  // Track Pal endpoints
  trackPal: {
    base: '/agents/track_pal',
    checkReminders: '/agents/track_pal/check_reminders',
    analyzePatterns: '/agents/track_pal/analyze_patterns',
    getApplications: '/agents/track_pal/get_applications',
    saveApplication: '/agents/track_pal/save_application',
    updateApplication: '/agents/track_pal/update_application'
  },
  
  // Mock Mate endpoints
  mockMate: {
    startInterview: '/agents/mock_mate/start_interview',
    respond: '/agents/mock_mate/respond',
    reviewInterview: '/agents/mock_mate/review_interview'
  },
  
  // Resume Refiner endpoints
  resumeRefiner: {
    upload: '/resumes/upload',
    layout: '/resumes',  // + /{id}/layout
    parse: '/resumes',   // + /{id}/parse
    evaluate: '/resumes', // + /{id}/evaluate
    match: '/resumes'    // + /{id}/match
  }
};

// Helper function to get full API URL for a specific endpoint
export const getApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${DEFAULT_API_BASE_URL}${endpoint}`;
  
  // Add query parameters if provided
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    url += `?${queryParams.toString()}`;
  }
  
  return url;
};

// Helper function to get all possible API URLs for a specific endpoint
// This is useful for the fallback mechanism in the app
export const getAllApiUrls = (endpoint: string): string[] => {
  return [
    `${API_BASE_URLS.localhost}${endpoint}`,
    `${API_BASE_URLS.emulator}${endpoint}`,
    `${API_BASE_URLS.device}${endpoint}`,
    `${API_BASE_URLS.fallback}${endpoint}`,
  ];
};

// Fetch with fallback mechanism that tries multiple base URLs if the first one fails
export const fetchWithFallback = async (
  endpoint: string,
  options?: RequestInit,
  params?: Record<string, string>
): Promise<Response> => {
  // Check if the endpoint already includes a base URL (starts with http)
  const isFullUrl = endpoint.startsWith('http');
  
  // Generate URLs to try
  const urls = isFullUrl
    ? [endpoint] // If it's already a full URL, just use it
    : Object.values(API_BASE_URLS).map(baseUrl => `${baseUrl}${endpoint}`); // Otherwise, try with different base URLs
  
  // Add query parameters if needed
  const urlsWithParams = urls.map(url => {
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      return `${url}?${queryParams.toString()}`;
    }
    return url;
  });
  
  let lastError;
  
  // Try each URL in sequence
  for (const url of urlsWithParams) {
    try {
      console.log(`Attempting to fetch from: ${url}`);
      const response = await fetch(url, options);
      if (response.ok) {
        console.log(`Successfully connected to: ${url}`);
        return response;
      }
      lastError = new Error(`API error: ${response.status} from ${url}`);
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      lastError = error;
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error('Failed to connect to any API endpoint');
};
