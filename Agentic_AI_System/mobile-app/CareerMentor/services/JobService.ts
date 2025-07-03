import { mockGlobalStateService } from './MockGlobalStateService';
import NotificationService from './NotificationService';

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

  return {
    id: savedJob.id,
    jobTitle: savedJob.position,
    company: savedJob.company,
    location: savedJob.location,
    applicationDeadline: null, // Not available in saved job format
    applicationDeadlineReminder: null,
    status: savedJob.status.toLowerCase(),
    followUpDate,
    followUpTime: '10:00', // Default time
    notes: savedJob.notes || '',
    jobUrl: savedJob.application_link,
    appliedDate: savedJob.created_at,
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
    description: existingSavedJob?.description || '',
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

export const JobService = {
  // Get all jobs (previously applications)
  getJobs: async (): Promise<JobApplication[]> => {
    try {
      // Get saved jobs from mock global state
      const savedJobs = mockGlobalStateService.getSavedJobs();
      
      // Convert saved jobs to application format
      return savedJobs.map(job => convertSavedJobToApplication(job));
    } catch (error) {
      console.error('Error getting jobs:', error);
      return [];
    }
  },

  // Add a new job
  addJob: async (application: Omit<JobApplication, 'id'>): Promise<JobApplication> => {
    try {
      const newApplication: JobApplication = {
        ...application,
        id: `job-${Date.now().toString()}`, // Simple ID generation
        appliedDate: new Date().toISOString(),
      };
      
      // Convert to saved job format and save to mock global state
      const savedJob = convertApplicationToSavedJob(newApplication);
      mockGlobalStateService.saveJob(savedJob);
      
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
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  },

  // Update an existing job
  updateJob: async (id: string, updatedData: Partial<JobApplication>): Promise<JobApplication | null> => {
    try {
      // Get all jobs
      const jobs = await JobService.getJobs();
      const index = jobs.findIndex(job => job.id === id);
      
      if (index === -1) return null;
      
      const originalJob = jobs[index];
      const updatedJob = {
        ...originalJob,
        ...updatedData
      };
      
      // Get the original saved job to preserve fields not in JobApplication
      const savedJobs = mockGlobalStateService.getSavedJobs();
      const originalSavedJob = savedJobs.find(job => job.id === id);
      
      // Convert updated job back to saved job format
      const updatedSavedJob = convertApplicationToSavedJob(updatedJob, originalSavedJob);
      
      // Update in mock global state
      mockGlobalStateService.saveJob(updatedSavedJob);
      
      // Handle notification updates if follow-up date changed
      if (updatedData.followUpDate !== undefined && 
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
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Delete a job
  deleteJob: async (id: string): Promise<boolean> => {
    try {
      // Remove from mock global state
      mockGlobalStateService.unsaveJob(id);
      
      // Cancel any notifications associated with this job
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
      
      return true;
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
  }
};

export default JobService;
