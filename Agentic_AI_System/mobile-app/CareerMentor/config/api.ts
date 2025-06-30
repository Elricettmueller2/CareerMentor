// API configuration for the CareerMentor app
// This file centralizes all API URLs and can be easily updated for different environments

// Base URLs for different environments
export const API_BASE_URLS = {
  // For iOS simulator or web
  localhost: 'http://localhost:8000',
  
  // For Android emulator
  emulator: 'http://10.0.2.2:8000',
  
  // For physical devices (adjust IP to your computer's IP)
  device: 'http://192.168.1.218:8000'
};

// Default API base URL - use device URL for production
export const DEFAULT_API_BASE_URL = API_BASE_URLS.device;

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
