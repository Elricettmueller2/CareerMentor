import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URLs - try different options based on environment
const API_URLS = {
  emulator: 'http://10.0.2.2:8000/agents/track_pal', // Android emulator
  localhost: 'http://localhost:8000/agents/track_pal', // iOS simulator or web
  device: 'http://192.168.1.100:8000/agents/track_pal' // Adjust this IP to your computer's IP when testing on physical device
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

export interface Reminder {
  message: string;
  type: 'follow_up' | 'interview' | 'resume' | 'general';
  applicationId?: string;
}

export interface PatternInsight {
  title: string;
  description: string;
  recommendation: string;
}

export const TrackPalService = {
  // Get the current user ID or use default
  getUserId: async (): Promise<string> => {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      return userId || DEFAULT_USER_ID;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return DEFAULT_USER_ID;
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

  // Get reminders from TrackPal agent
  getReminders: async (): Promise<string> => {
    try {
      const userId = await TrackPalService.getUserId();
      console.log('Calling check_reminders with userId:', userId);
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/check_reminders`);
        
        const response = await axios.post(`${baseUrl}/check_reminders`, {
          data: { user_id: userId } // Wrap in data object to match AgentRequest model
        });
        
        console.log('Reminders API response:', response.data);
        
        // Handle different response formats
        if (response.data && response.data.response) {
          if (typeof response.data.response === 'string') {
            return response.data.response;
          } else if (response.data.response.raw) {
            return response.data.response.raw;
          } else if (response.data.response.content) {
            return response.data.response.content;
          }
        }
        
        return 'No reminders available.';
      });
    } catch (error: any) {
      console.error('Error getting reminders:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      return `Failed to get reminders. Error: ${error.message}`;
    }
  },

  // Get application pattern analysis
  getPatternAnalysis: async (): Promise<string> => {
    try {
      const userId = await TrackPalService.getUserId();
      console.log('Calling analyze_patterns with userId:', userId);
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/analyze_patterns`);
        
        const response = await axios.post(`${baseUrl}/analyze_patterns`, {
          data: { user_id: userId } // Wrap in data object to match AgentRequest model
        });
        
        console.log('Pattern analysis API response:', response.data);
        
        // Handle different response formats
        if (response.data && response.data.response) {
          if (typeof response.data.response === 'string') {
            return response.data.response;
          } else if (response.data.response.raw) {
            return response.data.response.raw;
          } else if (response.data.response.content) {
            return response.data.response.content;
          }
        }
        
        return 'No pattern analysis available.';
      });
    } catch (error: any) {
      console.error('Error getting pattern analysis:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      return `Failed to analyze patterns. Error: ${error.message}`;
    }
  },

  // Ask TrackPal a direct question
  askQuestion: async (question: string): Promise<string> => {
    try {
      const userId = await TrackPalService.getUserId();
      console.log('Calling direct_test with userId:', userId, 'and question:', question);
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/direct_test`);
        
        const response = await axios.post(`${baseUrl}/direct_test`, {
          data: { // Wrap in data object to match AgentRequest model
            user_id: userId,
            message: question
          }
        });
        
        console.log('Direct question API response:', response.data);
        
        // Handle different response formats
        if (response.data && response.data.response) {
          if (typeof response.data.response === 'string') {
            return response.data.response;
          } else if (response.data.response.raw) {
            return response.data.response.raw;
          } else if (response.data.response.content) {
            return response.data.response.content;
          }
        }
        
        return 'No response available.';
      });
    } catch (error: any) {
      console.error('Error asking question:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      return `Failed to get a response. Error: ${error.message}`;
    }
  }
};

export default TrackPalService;
