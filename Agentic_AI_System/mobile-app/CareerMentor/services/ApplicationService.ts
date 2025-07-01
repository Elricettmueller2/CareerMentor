import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  applicationDeadline: string | null;
  status: string;
  followUpDate: string | null;
  followUpTime: string;
  notes: string;
  jobUrl?: string;
  appliedDate: string;
}

const APPLICATIONS_STORAGE_KEY = 'trackpal_applications';

export const ApplicationService = {
  // Get all applications
  getApplications: async (): Promise<JobApplication[]> => {
    try {
      // First try to get applications from local storage
      const jsonValue = await AsyncStorage.getItem(APPLICATIONS_STORAGE_KEY);
      const localApps = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      // If we have local applications, return those
      if (localApps.length > 0) {
        return localApps;
      }
      
      // Otherwise, return hardcoded dummy data
      const now = new Date();
      const dummyData: JobApplication[] = [
        {
          id: '1',
          jobTitle: 'UI Designer',
          company: 'Acme Corp',
          location: 'San Francisco, CA',
          applicationDeadline: null,
          status: 'applied',
          followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          followUpTime: '10:00',
          notes: 'Applied through company website',
          appliedDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days ago
        },
        {
          id: '2',
          jobTitle: 'Frontend Developer',
          company: 'TechStart',
          location: 'Remote',
          applicationDeadline: null,
          status: 'interview',
          followUpDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          followUpTime: '14:00',
          notes: 'First interview scheduled',
          appliedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
          id: '3',
          jobTitle: 'UX Researcher',
          company: 'BigCorp',
          location: 'New York, NY',
          applicationDeadline: null,
          status: 'rejected',
          followUpDate: null,
          followUpTime: '',
          notes: 'Rejected after initial screening',
          appliedDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
        }
      ];
      
      // Save to local storage for future use
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(dummyData));
      return dummyData;
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  },

  // Get applications by user ID (for future use)
  getApplicationsByUser: async (userId: string): Promise<JobApplication[]> => {
    // For now, we're not implementing user-specific storage
    // This is a placeholder for future implementation
    return ApplicationService.getApplications();
  },

  // Add a new application
  addApplication: async (application: Omit<JobApplication, 'id'>): Promise<JobApplication> => {
    try {
      const applications = await ApplicationService.getApplications();
      
      const newApplication: JobApplication = {
        ...application,
        id: Date.now().toString(), // Simple ID generation
        appliedDate: new Date().toISOString(),
      };
      
      const updatedApplications = [...applications, newApplication];
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updatedApplications));
      
      // Schedule follow-up notification if a follow-up date is set
      if (newApplication.followUpDate) {
        try {
          const followUpDate = new Date(newApplication.followUpDate);
          const notificationId = await NotificationService.scheduleFollowUpReminder(
            newApplication.id,
            newApplication.company,
            newApplication.jobTitle,
            followUpDate
          );
          
          if (notificationId) {
            console.log(`Scheduled follow-up notification ${notificationId} for new application ${newApplication.id}`);
          }
        } catch (notificationError) {
          // Log but don't throw - we don't want to prevent application creation if notification fails
          console.error('Error scheduling follow-up notification:', notificationError);
        }
      }
      
      return newApplication;
    } catch (error) {
      console.error('Error adding application:', error);
      throw error;
    }
  },

  // Update an existing application
  updateApplication: async (id: string, updatedData: Partial<JobApplication>): Promise<JobApplication | null> => {
    try {
      const applications = await ApplicationService.getApplications();
      const index = applications.findIndex(app => app.id === id);
      
      if (index === -1) return null;
      
      const originalApplication = applications[index];
      const updatedApplication = {
        ...originalApplication,
        ...updatedData
      };
      
      applications[index] = updatedApplication;
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
      
      // Handle notification updates if follow-up date changed
      if (updatedData.followUpDate !== undefined && 
          updatedData.followUpDate !== originalApplication.followUpDate) {
        try {
          // Get existing notifications for this application
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
              updatedApplication.company,
              updatedApplication.jobTitle,
              followUpDate
            );
          }
        } catch (notificationError) {
          console.error('Error updating notification:', notificationError);
          // Continue with application update even if notification update fails
        }
      }
      
      return updatedApplication;
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  },

  // Delete an application
  deleteApplication: async (id: string): Promise<boolean> => {
    try {
      const applications = await ApplicationService.getApplications();
      const updatedApplications = applications.filter(app => app.id !== id);
      
      if (updatedApplications.length === applications.length) {
        return false; // No application was deleted
      }
      
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updatedApplications));
      
      // Cancel any notifications associated with this application
      try {
        const notifications = await NotificationService.getApplicationNotifications(id);
        for (const notification of notifications) {
          if (notification.notificationId) {
            await NotificationService.cancelNotification(notification.notificationId);
          }
        }
      } catch (notificationError) {
        console.error('Error canceling notifications:', notificationError);
        // Continue with application deletion even if notification cancellation fails
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  },

  // Get applications that need follow-up (for TrackPal)
  getApplicationsNeedingFollowup: async (): Promise<JobApplication[]> => {
    try {
      const applications = await ApplicationService.getApplications();
      const today = new Date();
      
      return applications.filter(app => {
        if (!app.followUpDate) return false;
        
        const followUpDate = new Date(app.followUpDate);
        return followUpDate <= today && app.status !== 'rejected';
      });
    } catch (error) {
      console.error('Error getting follow-up applications:', error);
      return [];
    }
  }
};

export default ApplicationService;
