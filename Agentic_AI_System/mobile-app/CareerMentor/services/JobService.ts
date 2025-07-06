import NotificationService from './NotificationService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedJob {
  id: string;
  position: string;
  company: string;
  location: string;
  application_link: string;
  description: string;
  match_score: number;
  distance: number;
  education_required: string;
  experience_required: number;
  salary: string;
  skills: string[];
  requirements: string;
  source: string;
  status: string;
  days_since_applied: string;
  days_until_followup: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  applicationDeadline: string | null;
  applicationDeadlineReminder: string | null;
  status: string;
  followUpDate: string | null;
  followUpTime: string;
  notes: string;
  jobUrl?: string;
  appliedDate: string;
  interviewReminder: string | null;
}

// Convert SavedJob to JobApplication format
const convertSavedJobToApplication = (savedJob: SavedJob): JobApplication => {
  // Calculate follow-up date if days_until_followup is provided
  let followUpDate: string | null = null;
  if (savedJob.days_until_followup && savedJob.days_until_followup !== '') {
    const days = parseInt(savedJob.days_until_followup);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      followUpDate = date.toISOString();
    }
  }
  
  // Ensure we have a valid date for appliedDate
  let appliedDate = savedJob.created_at;
  if (!appliedDate || appliedDate === 'Invalid Date' || !Date.parse(appliedDate)) {
    appliedDate = new Date().toISOString();
  }

  return {
    id: savedJob.id,
    jobTitle: savedJob.position || 'Unknown Title', // Ensure we always have a title
    company: savedJob.company || 'Unknown Company',
    location: savedJob.location || '',
    description: savedJob.description || '',
    applicationDeadline: null, // Not available in saved job format
    applicationDeadlineReminder: null,
    status: savedJob.status?.toLowerCase() || 'saved',
    followUpDate,
    followUpTime: '10:00', // Default time
    notes: savedJob.notes || '',
    jobUrl: savedJob.application_link || '',
    appliedDate: appliedDate,
    interviewReminder: null
  };
};

// Convert JobApplication back to SavedJob format
const convertApplicationToSavedJob = (application: JobApplication, existingSavedJob?: SavedJob): SavedJob => {
  // Calculate days_until_followup if followUpDate is provided
  let daysUntilFollowup = '';
  if (application.followUpDate) {
    const followUpDate = new Date(application.followUpDate);
    const today = new Date();
    const diffTime = followUpDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysUntilFollowup = diffDays > 0 ? diffDays.toString() : '0';
  }

  // Calculate days_since_applied
  const appliedDate = new Date(application.appliedDate);
  const today = new Date();
  const diffTime = today.getTime() - appliedDate.getTime();
  const daysSinceApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24)).toString();

  return {
    id: application.id,
    position: application.jobTitle,
    company: application.company,
    location: application.location,
    application_link: application.jobUrl || '',
    description: application.description,
    match_score: existingSavedJob?.match_score || 0,
    distance: existingSavedJob?.distance || 0,
    education_required: existingSavedJob?.education_required || '',
    experience_required: existingSavedJob?.experience_required || 0,
    salary: existingSavedJob?.salary || '',
    skills: existingSavedJob?.skills || [],
    requirements: existingSavedJob?.requirements || '',
    source: existingSavedJob?.source || 'Manual',
    status: application.status.charAt(0).toUpperCase() + application.status.slice(1),
    days_since_applied: daysSinceApplied,
    days_until_followup: daysUntilFollowup,
    notes: application.notes,
    created_at: application.appliedDate,
    updated_at: new Date().toISOString()
  };
};

// API base URLs - try different options based on environment
const API_URLS = {
  emulator: 'http://10.0.2.2:8000/agents/track_pal', // Android emulator
  localhost: 'http://localhost:8000/agents/track_pal', // iOS simulator or web
  device: 'http://192.168.1.218:8000/agents/track_pal', // Adjust this IP to your computer's IP when testing on physical device
  docker: 'http://host.docker.internal:8000/agents/track_pal' // Docker container
};

// Default to localhost, but you can change this based on your environment
let API_BASE_URL = API_URLS.localhost;

// Helper function to try different API URLs if one fails
const tryAPIUrls = async (apiCall: (url: string) => Promise<any>): Promise<any> => {
  // Try the current API URL first
  try {
    return await apiCall(API_BASE_URL);
  } catch (error: any) {
    console.log(`Failed with URL ${API_BASE_URL}: ${error.message}`);
    
    // If that fails, try other URLs
    for (const [key, url] of Object.entries(API_URLS)) {
      if (url === API_BASE_URL) continue; // Skip the one we already tried
      
      try {
        console.log(`Trying alternative URL: ${url}`);
        const result = await apiCall(url);
        // If successful, update the default URL for future calls
        API_BASE_URL = url;
        console.log(`Success with URL ${url}, updating default`);
        return result;
      } catch (innerError: any) {
        console.log(`Failed with URL ${url}: ${innerError.message}`);
        // Continue to the next URL
      }
    }
    
    // If all URLs fail, throw the original error
    throw error;
  }
};

const USER_ID_KEY = 'user_id';

// Default user ID for testing
const DEFAULT_USER_ID = 'test_user';

// Get the current user ID or use default
const getUserId = async (): Promise<string> => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId || DEFAULT_USER_ID;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return DEFAULT_USER_ID;
  }
};

export const JobService = {
  // Get all jobs (previously applications)
  getJobs: async (): Promise<JobApplication[]> => {
    try {
      const userId = await getUserId();
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/get_applications`);
        
        const response = await axios.post(`${baseUrl}/get_applications`, {
          data: { user_id: userId }
        });
        
        console.log('Get applications response:', response.data);
        
        if (response.data && response.data.applications) {
          // Convert each saved job to JobApplication format
          return response.data.applications.map((job: SavedJob) => convertSavedJobToApplication(job));
        }
        
        return [];
      });
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  },

  // Add a new job
  addJob: async (application: Omit<JobApplication, 'id'>): Promise<JobApplication> => {
    try {
      const userId = await getUserId();
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/save_application`);
        
        const response = await axios.post(`${baseUrl}/save_application`, {
          data: { 
            user_id: userId,
            application: {
              ...application,
              appliedDate: new Date().toISOString(),
            }
          }
        });
        
        console.log('Save application response:', response.data);
        
        if (response.data && response.data.application) {
          const newApplication = response.data.application;
          
          // Schedule notification if follow-up date is set
          if (newApplication.followUpDate) {
            try {
              const followUpDate = new Date(newApplication.followUpDate);
              await NotificationService.scheduleFollowUpReminder(
                newApplication.id,
                newApplication.company,
                newApplication.jobTitle,
                followUpDate
              );
            } catch (notificationError) {
              console.error('Error scheduling notification:', notificationError);
            }
          }
          
          return newApplication;
        }
        
        throw new Error('Failed to save application');
      });
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  },

  // Update an existing job
  updateJob: async (id: string, updatedData: Partial<JobApplication>): Promise<JobApplication | null> => {
    try {
      const userId = await getUserId();
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/update_application`);
        
        const response = await axios.post(`${baseUrl}/update_application`, {
          data: { 
            user_id: userId,
            app_id: id,
            updates: updatedData
          }
        });
        
        console.log('Update application response:', response.data);
        
        if (response.data && response.data.application) {
          const updatedJob = response.data.application;
          
          // Get the original job to check if follow-up date changed
          const jobs = await JobService.getJobs();
          const originalJob = jobs.find(job => job.id === id);
          
          // Handle notification updates if follow-up date changed
          if (originalJob && updatedData.followUpDate !== undefined && 
              updatedData.followUpDate !== originalJob.followUpDate) {
            try {
              // Get existing notifications for this job
              const notifications = await NotificationService.getApplicationNotifications(id);
              
              // Cancel existing notifications
              for (const notification of notifications) {
                if (notification.notificationId) {
                  await NotificationService.cancelNotification(notification.notificationId);
                }
              }
              
              // Schedule new notification if follow-up date is set
              if (updatedData.followUpDate) {
                const followUpDate = new Date(updatedData.followUpDate);
                await NotificationService.scheduleFollowUpReminder(
                  id,
                  updatedJob.company,
                  updatedJob.jobTitle,
                  followUpDate
                );
              }
            } catch (notificationError) {
              console.error('Error updating notification:', notificationError);
            }
          }
          
          return updatedJob;
        }
        
        return null;
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Delete a job
  deleteJob: async (id: string): Promise<boolean> => {
    try {
      const userId = await getUserId();
      
      // First cancel any notifications associated with this job
      try {
        const notifications = await NotificationService.getApplicationNotifications(id);
        for (const notification of notifications) {
          if (notification.notificationId) {
            await NotificationService.cancelNotification(notification.notificationId);
          }
        }
      } catch (notificationError) {
        console.error('Error canceling notifications:', notificationError);
      }
      
      // Then delete the application from the backend
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/delete_application`);
        
        const response = await axios.post(`${baseUrl}/delete_application`, {
          data: { 
            user_id: userId,
            app_id: id
          }
        });
        
        console.log('Delete application response:', response.data);
        
        if (response.data && response.data.success) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Get jobs that need follow-up (for TrackPal)
  getJobsNeedingFollowup: async (): Promise<JobApplication[]> => {
    try {
      const jobs = await JobService.getJobs();
      const today = new Date();
      
      return jobs.filter(job => {
        if (!job.followUpDate) return false;
        
        const followUpDate = new Date(job.followUpDate);
        return followUpDate <= today && job.status !== 'rejected';
      });
    } catch (error) {
      console.error('Error getting follow-up jobs:', error);
      return [];
    }
  },
  
  // Set user ID
  setUserId: async (userId: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  },
  
  // Get the current user ID
  getUserId
};

export default JobService;
