import AsyncStorage from '@react-native-async-storage/async-storage';

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
          status: 'Applied',
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
          status: 'Interview',
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
          status: 'Rejected',
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
      
      const updatedApplication = {
        ...applications[index],
        ...updatedData
      };
      
      applications[index] = updatedApplication;
      await AsyncStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
      
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
        return followUpDate <= today && app.status !== 'Rejected';
      });
    } catch (error) {
      console.error('Error getting follow-up applications:', error);
      return [];
    }
  }
};

export default ApplicationService;
