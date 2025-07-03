import mockData from '../assets/data/mock_global_state.json';
import { JobApplication } from './ApplicationService';

/**
 * Mock implementation of the GlobalStateService to use until MongoDB integration is ready
 * This service mimics the structure and methods of the Python GlobalStateService
 */
export class MockGlobalStateService {
  private static instance: MockGlobalStateService;
  private mockState: any;

  private constructor() {
    this.mockState = JSON.parse(JSON.stringify(mockData));
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): MockGlobalStateService {
    if (!MockGlobalStateService.instance) {
      MockGlobalStateService.instance = new MockGlobalStateService();
    }
    return MockGlobalStateService.instance;
  }

  /**
   * Get the full global state
   */
  public getState(userId: string = 'default_user'): any {
    return this.mockState;
  }

  /**
   * Update the global state
   */
  public setState(state: any, userId: string = 'default_user'): void {
    this.mockState = { ...state };
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Get the user profile from the global state
   */
  public getUserProfile(userId: string = 'default_user'): any {
    return this.mockState.agent_knowledge.user_profile;
  }

  /**
   * Update the user profile in the global state
   */
  public updateUserProfile(profileData: any, userId: string = 'default_user'): void {
    this.mockState.agent_knowledge.user_profile = { ...profileData };
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Get the job search data from the global state
   */
  public getJobSearchData(userId: string = 'default_user'): any {
    return this.mockState.agent_knowledge.job_search;
  }

  /**
   * Update the job search data in the global state
   */
  public updateJobSearchData(jobSearchData: any, userId: string = 'default_user'): void {
    this.mockState.agent_knowledge.job_search = { ...jobSearchData };
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Get saved jobs from the global state
   */
  public getSavedJobs(userId: string = 'default_user'): any[] {
    return this.mockState.agent_knowledge.job_search.saved_jobs;
  }

  /**
   * Add a job to saved jobs
   */
  public saveJob(jobData: any, userId: string = 'default_user'): void {
    const savedJobs = this.mockState.agent_knowledge.job_search.saved_jobs;
    
    // Check if job already exists
    const existingJobIndex = savedJobs.findIndex((job: any) => job.id === jobData.id);
    
    if (existingJobIndex >= 0) {
      // Update existing job
      savedJobs[existingJobIndex] = {
        ...jobData,
        updated_at: new Date().toISOString()
      };
    } else {
      // Add new job
      savedJobs.push({
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Remove a job from saved jobs
   */
  public unsaveJob(jobId: string, userId: string = 'default_user'): void {
    const savedJobs = this.mockState.agent_knowledge.job_search.saved_jobs;
    const updatedJobs = savedJobs.filter((job: any) => job.id !== jobId);
    this.mockState.agent_knowledge.job_search.saved_jobs = updatedJobs;
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Get all job applications
   */
  public getApplications(userId: string = 'default_user'): JobApplication[] {
    const applications = this.mockState.agent_knowledge.applications;
    return Object.values(applications);
  }

  /**
   * Get a specific job application
   */
  public getApplication(applicationId: string, userId: string = 'default_user'): JobApplication | null {
    const applications = this.mockState.agent_knowledge.applications;
    return applications[applicationId] || null;
  }

  /**
   * Add or update a job application
   */
  public saveApplication(application: JobApplication, userId: string = 'default_user'): void {
    if (!application.id) {
      application.id = `app-${Date.now()}`;
    }
    
    this.mockState.agent_knowledge.applications[application.id] = application;
    this.mockState.last_updated = Date.now() / 1000;
  }

  /**
   * Delete a job application
   */
  public deleteApplication(applicationId: string, userId: string = 'default_user'): void {
    if (this.mockState.agent_knowledge.applications[applicationId]) {
      delete this.mockState.agent_knowledge.applications[applicationId];
      this.mockState.last_updated = Date.now() / 1000;
    }
  }

  /**
   * Add a search query to history
   */
  public addSearchQuery(query: string, resultsCount: number, userId: string = 'default_user'): void {
    const searchHistory = this.mockState.agent_knowledge.job_search.search_history;
    const recentSearches = this.mockState.agent_knowledge.job_search.recent_searches;
    
    // Add to search history
    searchHistory.push({
      query,
      date: new Date().toISOString(),
      results_count: resultsCount
    });
    
    // Update recent searches (keep only unique values and limit to 5)
    if (!recentSearches.includes(query)) {
      recentSearches.unshift(query);
      if (recentSearches.length > 5) {
        recentSearches.pop();
      }
    }
    
    this.mockState.last_updated = Date.now() / 1000;
  }
}

// Export a singleton instance
export const mockGlobalStateService = MockGlobalStateService.getInstance();
