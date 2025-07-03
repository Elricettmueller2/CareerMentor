/**
 * Utility functions for loading data from JSON files
 */
import { mockGlobalStateService } from '../services/MockGlobalStateService';

// Job interface
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  match: number;
}

// Function to load jobs from the MockGlobalStateService
export const loadJobs = async (): Promise<Job[]> => {
  try {
    // Get saved jobs from the mock global state service
    const savedJobs = mockGlobalStateService.getSavedJobs();
    
    // Transform the saved jobs to match our Job interface
    return savedJobs.map(job => ({
      id: job.id,
      title: job.position || job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      skills: job.skills || [],
      match: job.match_score || 0
    }));
  } catch (error) {
    console.error('Error loading jobs data from MockGlobalStateService:', error);
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
