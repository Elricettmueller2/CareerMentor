/**
 * Utility functions for loading data from JSON files
 */
import { mockGlobalStateService } from '../services/MockGlobalStateService';
import { API_BASE_URL, API_FALLBACK_URLS } from '../constants/ApiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Job interface
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  match?: number;
}

// Function to load jobs from the backend API
export const loadJobs = async (): Promise<Job[]> => {
  try {
    // Get the user ID from AsyncStorage (default to "default_user" if not found)
    const userId = await AsyncStorage.getItem('userId') || 'default_user';
    
    // Endpoint to get saved jobs from MongoDB
    const endpoint = `/agents/path_finder/saved_jobs/${userId}`;
    
    console.log(`Fetching saved jobs from API: ${API_BASE_URL}${endpoint}`);
    
    // Try to fetch jobs from the main API
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved jobs fetched successfully from MongoDB:', data.length);
        
        // Transform the saved jobs to match our Job interface
        return data.map(job => ({
          id: job.id,
          title: job.position || job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          skills: job.skills || [],
          match: job.match_score || 0
        }));
      } else {
        throw new Error(`API returned status: ${response.status}`);
      }
    } catch (apiError) {
      console.error('Error fetching jobs from main API:', apiError);
      
      // Try fallback URLs if the main API fails
      for (const fallbackUrl of API_FALLBACK_URLS) {
        try {
          console.log(`Trying fallback URL: ${fallbackUrl}${endpoint}`);
          const fallbackResponse = await fetch(`${fallbackUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add a shorter timeout for fallback URLs
            signal: AbortSignal.timeout(15000)
          });
          
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            console.log('Saved jobs fetched successfully from fallback:', data.length);
            
            // Transform the saved jobs to match our Job interface
            return data.map(job => ({
              id: job.id,
              title: job.position || job.title || '',
              company: job.company || '',
              location: job.location || '',
              description: job.description || '',
              skills: job.skills || [],
              match: job.match_score || 0
            }));
          }
        } catch (fallbackError) {
          console.error(`Fallback URL failed: ${fallbackError.message}`);
          // Continue to the next fallback URL
        }
      }
      
      // If all API calls fail, fall back to mock data with a warning
      console.warn('All API calls failed, falling back to mock data');
      const savedJobs = mockGlobalStateService.getSavedJobs();
      
      return savedJobs.map(job => ({
        id: job.id,
        title: job.position || job.title || '',
        company: job.company || '',
        location: job.location || '',
        description: job.description || '',
        skills: job.skills || [],
        match: job.match_score || 0
      }));
    }
  } catch (error) {
    console.error('Error loading jobs data:', error);
    return [];
  }
};

// Function to get a specific job by ID
export const getJobById = async (jobId: string): Promise<Job | undefined> => {
  try {
    // Get saved jobs from the mock global state service
    const savedJobs = mockGlobalStateService.getSavedJobs();
    
    // Find the job with the matching ID
    const job = savedJobs.find(job => job.id === jobId);
    
    if (!job) return undefined;
    
    // Transform to match our Job interface
    return {
      id: job.id,
      title: job.position || job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      skills: job.skills || [],
      match: job.match_score || 0
    };
  } catch (error) {
    console.error(`Error getting job with ID ${jobId} from MockGlobalStateService:`, error);
    return undefined;
  }
};
