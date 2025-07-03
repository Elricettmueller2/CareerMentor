// API configuration for the CareerMentor app
// This file centralizes all API URLs and can be easily updated for different environments

import { API_BASE_URL, API_FALLBACK_URLS } from '../constants/ApiEndpoints';

// Base URLs for different environments - now using ngrok URL as primary
export const API_BASE_URLS = {
  // Primary URL from ApiEndpoints.ts (ngrok)
  primary: API_BASE_URL,
  
  // Legacy URLs kept for backward compatibility but redirected to ngrok
  localhost: API_BASE_URL,
  emulator: API_BASE_URL,
  docker: API_BASE_URL,
  device: API_BASE_URL,
  fallback: API_BASE_URL
};

// Default API base URL - use the one from ApiEndpoints.ts
export const DEFAULT_API_BASE_URL = API_BASE_URL;

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
  // Use the API_FALLBACK_URLS directly from ApiEndpoints.ts
  return API_FALLBACK_URLS.map(baseUrl => `${baseUrl}${endpoint}`);
};

// Fetch with fallback mechanism that tries multiple ngrok URLs if the first one fails
export const fetchWithFallback = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  // Check if the endpoint already includes a base URL (starts with http)
  const isFullUrl = endpoint.startsWith('http');
  
  // Generate URLs to try - use the primary URL first, then fallbacks if needed
  const urls = isFullUrl
    ? [endpoint] // If it's already a full URL, just use it
    : getAllApiUrls(endpoint); // Otherwise, try with different base URLs from API_FALLBACK_URLS
  
  let lastError;
  
  // Try each URL in sequence
  for (const url of urls) {
    try {
      console.log(`Attempting to fetch from: ${url}`);
      const response = await fetch(url, options);
      if (response.ok) {
        console.log(`Successfully connected to: ${url}`);
        return response;
      }
      lastError = new Error(`API error: ${response.status} from ${url}`);
    } catch (error: any) {
      console.warn(`Failed to fetch from ${url}:`, error);
      lastError = error;
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error('Failed to connect to any API endpoint');
};
