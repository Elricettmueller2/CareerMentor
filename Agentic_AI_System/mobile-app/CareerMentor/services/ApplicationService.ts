import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService';
import { mockGlobalStateService } from './MockGlobalStateService';

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

const APPLICATIONS_STORAGE_KEY = 'trackpal_applications';

export const ApplicationService = {
  // Get all applications
  getApplications: async (): Promise<JobApplication[]> => {
    try {
      // Try to get applications from MockGlobalStateService first (simulating MongoDB)
      const mockApps = mockGlobalStateService.getApplications();
      
      if (mockApps && mockApps.length > 0) {
        console.log('Retrieved applications from mock global state');
        return mockApps;
      }
      
      // Fall back to local storage if mock data is not available
      const jsonValue = await AsyncStorage.getItem(APPLICATIONS_STORAGE_KEY);
      const localApps = jsonValue != null ? JSON.parse(jsonValue) : [];
      
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
          description: '',
          applicationDeadline: null,
          applicationDeadlineReminder: null,
          status: 'applied',
          followUpDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          followUpTime: '10:00',
          notes: 'Applied through company website',
          appliedDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
          interviewReminder: null
        },
        {
          id: '2',
          jobTitle: 'Frontend Developer',
          company: 'TechStart',
          location: 'Remote',
          description: '',
          applicationDeadline: null,
          applicationDeadlineReminder: null,
          status: 'interview',
          followUpDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          followUpTime: '14:00',
          notes: 'First interview scheduled',
          appliedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          interviewReminder: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        },
        {
          id: '3',
          jobTitle: 'UX Researcher',
          company: 'BigCorp',
          location: 'New York, NY',
          description: '',
          applicationDeadline: null,
          applicationDeadlineReminder: null,
          status: 'rejected',
          followUpDate: null,
          followUpTime: '',
          notes: 'Position was filled internally',
          appliedDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
          interviewReminder: null
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
      // Generate a unique ID
      const id = Date.now().toString();
      const newApplication: JobApplication = {
        ...application,
        id
      };
      
      // Get existing applications
      const existingApps = await ApplicationService.getApplications();
      const updatedApps = [...existingApps, newApplication];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updatedApps));
      
      // Also save to MockGlobalStateService
      mockGlobalStateService.saveApplication(newApplication);
      
      // Schedule notification if follow-up date is set
      if (newApplication.followUpDate) {
        await NotificationService.scheduleFollowUpReminder(
          newApplication.id,
          newApplication.jobTitle,
          newApplication.company,
          new Date(newApplication.followUpDate)
        );
      }
      
      return newApplication;
    } catch (error) {
      console.error('Error adding application:', error);
      throw error;
    }
  },

  // Update an existing application
  updateApplication: async (application: JobApplication): Promise<JobApplication> => {
    try {
      // Get existing applications
      const existingApps = await ApplicationService.getApplications();
      
      // Find the index of the application to update
      const index = existingApps.findIndex(app => app.id === application.id);
      
      if (index === -1) {
        throw new Error(`Application with ID ${application.id} not found`);
      }
      
      // Update the application
      existingApps[index] = application;
      
      // Save to AsyncStorage for now
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(existingApps));
      
      // Also save the updated application to MockGlobalStateService
      mockGlobalStateService.saveApplication(application);
      
      // Update notification if follow-up date is set
      if (application.followUpDate) {
        await NotificationService.scheduleFollowUpReminder(
          application.id,
          application.jobTitle,
          application.company,
          new Date(application.followUpDate)
        );
      } else {
        // Cancel notification if follow-up date is removed
        await NotificationService.cancelNotification(application.id);
      }
      
      return application;
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  },

  // Delete an application
  deleteApplication: async (id: string): Promise<void> => {
    try {
      // Get existing applications
      const existingApps = await ApplicationService.getApplications();
      
      // Filter out the application to delete
      const updatedApps = existingApps.filter(app => app.id !== id);
      
      // Save to AsyncStorage for now
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(updatedApps));
      
      // Also delete from MockGlobalStateService
      mockGlobalStateService.deleteApplication(id);
      
      // Cancel any scheduled notifications
      await NotificationService.cancelNotification(id);
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
