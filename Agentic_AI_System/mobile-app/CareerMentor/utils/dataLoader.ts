/**
 * Utility functions for loading data from JSON files
 */

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

// Function to load jobs from the JSON file
export const loadJobs = async (): Promise<Job[]> => {
  try {
    // In a React Native environment, we need to import JSON directly
    const jobsData = require('../assets/data/dummyJobs.json');
    return jobsData.jobs;
  } catch (error) {
    console.error('Error loading jobs data:', error);
    return [];
  }
};

// Function to get a specific job by ID
export const getJobById = async (jobId: string): Promise<Job | undefined> => {
  try {
    const jobs = await loadJobs();
    return jobs.find(job => job.id === jobId);
  } catch (error) {
    console.error(`Error getting job with ID ${jobId}:`, error);
    return undefined;
  }
};
