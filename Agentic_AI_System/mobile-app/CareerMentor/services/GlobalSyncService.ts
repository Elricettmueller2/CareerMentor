import axios from 'axios';
import GlobalState, { GlobalState as GlobalStateType } from './GlobalStateService';
import { API_BASE_URL, API_FALLBACK_URLS } from '../constants/ApiEndpoints';

/**
 * GlobalSyncService - Service for syncing the global state between frontend and backend
 * 
 * This service provides methods for syncing the global state between the frontend and backend.
 * It uses the GlobalStateService to access the frontend state and the backend API to sync with the backend.
 */

// Using API_BASE_URL and API_FALLBACK_URLS from ApiEndpoints.ts
// This ensures we're using the same URLs that are updated by the start_careermentor.sh script

// Helper function to try different API URLs if one fails
const tryAPIUrls = async (apiCall: (url: string) => Promise<any>): Promise<any> => {
  // Try the current API URL first
  try {
    return await apiCall(API_BASE_URL);
  } catch (error: any) {
    console.log(`Failed with URL ${API_BASE_URL}: ${error.message}`);
    
    // If that fails, try fallback URLs from ApiEndpoints.ts
    for (const url of API_FALLBACK_URLS) {
      if (url === API_BASE_URL) continue; // Skip the one we already tried
      
      try {
        console.log(`Trying alternative URL: ${url}`);
        const result = await apiCall(url);
        console.log(`Success with URL ${url}`);
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

export const GlobalSyncService = {
  /**
   * Sync the frontend state with the backend
   * 
   * @returns Promise with the result of the sync operation
   */
  syncWithBackend: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Wait for initialization to complete
      await GlobalState.waitForInitialization();
      
      // Get the current frontend state
      const frontendState = GlobalState.getState();
      
      // Add lastSyncTime to the state
      const stateToSync = {
        ...frontendState,
        lastSyncTime: Date.now(),
      };
      
      // Send the state to the backend
      const response = await tryAPIUrls(async (baseUrl) => {
        console.log('Syncing with backend:', `${baseUrl}/global-state/sync`);
        
        return await axios.post(`${baseUrl}/global-state/sync`, {
          state: stateToSync
        });
      });
      
      console.log('Sync response:', response.data);
      
      // If the backend returned an updated state, update the frontend state
      if (response.data && response.data.success && response.data.state) {
        // Update the frontend state with the backend state
        // We're using updateEntireState to avoid triggering another sync
        GlobalState.updateEntireState(response.data.state);
      }
      
      return {
        success: true,
        message: response.data?.message || 'Sync successful'
      };
    } catch (error: any) {
      console.error('Error syncing with backend:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`
      };
    }
  },
  
  /**
   * Get the backend state
   * 
   * @returns Promise with the backend state
   */
  getBackendState: async (): Promise<{ success: boolean; state?: GlobalStateType; message?: string }> => {
    try {
      const response = await tryAPIUrls(async (baseUrl) => {
        console.log('Getting backend state:', `${baseUrl}/global-state`);
        
        return await axios.get(`${baseUrl}/global-state`);
      });
      
      console.log('Backend state response:', response.data);
      
      if (response.data && response.data.success && response.data.state) {
        return {
          success: true,
          state: response.data.state
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get backend state'
        };
      }
    } catch (error: any) {
      console.error('Error getting backend state:', error);
      return {
        success: false,
        message: `Failed to get backend state: ${error.message}`
      };
    }
  },
  
  /**
   * Update a specific knowledge item in the backend
   * 
   * @param key The key to update (in snake_case)
   * @param value The new value
   * @returns Promise with the result of the update operation
   */
  updateKnowledge: async (key: string, value: any): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await tryAPIUrls(async (baseUrl) => {
        console.log('Updating knowledge:', `${baseUrl}/global-state/knowledge`);
        
        return await axios.post(`${baseUrl}/global-state/knowledge`, {
          key,
          value
        });
      });
      
      console.log('Update knowledge response:', response.data);
      
      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Update successful'
      };
    } catch (error: any) {
      console.error('Error updating knowledge:', error);
      return {
        success: false,
        message: `Update failed: ${error.message}`
      };
    }
  },
  
  /**
   * Initialize the sync service
   * 
   * This should be called when the app starts to ensure the frontend and backend are in sync
   */
  initialize: async (): Promise<void> => {
    try {
      console.log('Initializing GlobalSyncService');
      
      // Wait for the GlobalState to initialize
      await GlobalState.waitForInitialization();
      
      // Try to get the backend state
      const backendStateResult = await GlobalSyncService.getBackendState();
      
      if (backendStateResult.success && backendStateResult.state) {
        // Get the current frontend state
        const frontendState = GlobalState.getState();
        
        // Check which state is newer
        const backendLastUpdated = backendStateResult.state.system?.lastSyncTime;
        const frontendLastUpdated = frontendState.system?.lastSyncTime;
        
        if (!frontendLastUpdated || (backendLastUpdated && backendLastUpdated > frontendLastUpdated)) {
          // Backend state is newer, update frontend
          GlobalState.updateEntireState(backendStateResult.state);
          console.log('Updated frontend state with backend state');
        } else {
          // Frontend state is newer or same age, sync to backend
          await GlobalSyncService.syncWithBackend();
          console.log('Synced frontend state to backend');
        }
      } else {
        // Failed to get backend state, sync frontend state to backend
        await GlobalSyncService.syncWithBackend();
        console.log('Failed to get backend state, synced frontend state to backend');
      }
    } catch (error) {
      console.error('Error initializing GlobalSyncService:', error);
    }
  }
};

export default GlobalSyncService;
