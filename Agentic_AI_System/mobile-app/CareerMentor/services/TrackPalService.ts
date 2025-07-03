import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_FALLBACK_URLS } from '../constants/ApiEndpoints';

// Using API_BASE_URL and API_FALLBACK_URLS from ApiEndpoints.ts
// This ensures we're using the same URLs that are updated by the start_careermentor.sh script
// We'll append the TrackPal endpoint path when making API calls
import mockData from '../assets/data/mock_global_state.json';
import { mockGlobalStateService } from './MockGlobalStateService';


// Helper function to try different API URLs if one fails
const tryAPIUrls = async (apiCall: (url: string) => Promise<any>): Promise<any> => {
  // Create the full URL with the TrackPal endpoint path
  const baseUrl = `${API_BASE_URL}/agents/track_pal`;
  
  // Try the current API URL first
  try {
    return await apiCall(baseUrl);
  } catch (error: any) {
    console.log(`Failed with URL ${baseUrl}: ${error.message}`);
    
    // If that fails, try fallback URLs from ApiEndpoints.ts
    for (const url of API_FALLBACK_URLS) {
      const fallbackUrl = `${url}/agents/track_pal`;
      if (fallbackUrl === baseUrl) continue; // Skip the one we already tried
      
      try {
        console.log(`Trying alternative URL: ${fallbackUrl}`);
        const result = await apiCall(fallbackUrl);
        console.log(`Success with URL ${fallbackUrl}`);
        return result;
      } catch (innerError: any) {
        console.log(`Failed with URL ${fallbackUrl}: ${innerError.message}`);
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
  id: string;
  icon: string;
  content: string;
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
      
      // Get applications from mock global state
      const applications = mockGlobalStateService.getApplications();
      
      // First try to send the applications to the backend for AI analysis
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/check_reminders`);
        
        // Send the applications data from mock_global_state.json to the backend
        const response = await axios.post(`${baseUrl}/check_reminders`, {
          data: { 
            user_id: userId,
            applications: applications // Send the actual applications data
          }
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

  // Parse pattern analysis text into structured insights
  parsePatternInsights: (analysisText: string): PatternInsight[] => {
    // Return empty array if no analysis text or error message
    if (!analysisText || analysisText.trim() === '' || 
        analysisText.includes('No pattern analysis available') || 
        analysisText.includes('Failed to analyze patterns')) {
      return [];
    }

    try {
      // The backend now sends descriptions that follow the titled insights
      // Each insight is a complete sentence/paragraph
      const lines = analysisText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const insights: PatternInsight[] = [];
      
      // Patterns to match for icon selection
      const patterns = [
        { regex: /([\d.]+)\s*%|percent|percentage/i, icon: 'stats-chart' },  // Percentage stats
        { regex: /response|callback|interview|reply/i, icon: 'mail' },      // Response rates
        { regex: /time|hour|morning|afternoon|evening|day|week/i, icon: 'time' },    // Timing related
        { regex: /skill|technology|keyword|stack|language|code/i, icon: 'code' },    // Skills/keywords
        { regex: /company|employer|startup|corporation|size|industry|sector/i, icon: 'business' }, // Company related
        { regex: /resume|cv|application|cover letter|version/i, icon: 'document-text' }, // Application docs
        { regex: /follow.?up|contact|reach out|check.?in/i, icon: 'chatbubbles' }         // Follow-ups
      ];

      // Process each line as a complete insight
      for (const line of lines) {
        // Skip if too short or if it's an insight title line
        if (line.length < 10 || line.match(/^Insight #\d+:/i)) continue;
        
        // Find appropriate icon based on content
        let icon = 'analytics';
        for (const pattern of patterns) {
          if (line.match(pattern.regex)) {
            icon = pattern.icon;
            break;
          }
        }
        
        insights.push({
          id: `insight-${insights.length + 1}`,
          icon,
          content: line
        });

        // Limit to 3 insights
        if (insights.length >= 3) break;
      }

      // Return whatever insights we found, even if less than 3
      return insights;
    } catch (error) {
      console.error('Error parsing pattern insights:', error);
      return [];
    }
  },

  // Get pattern analysis from TrackPal agent
  getPatternAnalysis: async (): Promise<string> => {
    try {
      const userId = await TrackPalService.getUserId();
      console.log('Calling analyze_patterns with userId:', userId);
      
      // Get applications from mock global state
      const applications = mockGlobalStateService.getApplications();
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/analyze_patterns`);
        
        // Send the applications data from mock_global_state.json to the backend
        const response = await axios.post(`${baseUrl}/analyze_patterns`, {
          data: { 
            user_id: userId,
            applications: applications // Send the actual applications data
          }
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
      return `Failed to get pattern analysis. Error: ${error.message}`;
    }
  },

  // Get pattern insights (parsed from pattern analysis)
  getPatternInsights: async (): Promise<PatternInsight[]> => {
    try {
      const analysisText = await TrackPalService.getPatternAnalysis();
      return TrackPalService.parsePatternInsights(analysisText);
    } catch (error) {
      console.error('Error getting pattern insights:', error);
      return [];
    }
  },

  // Note: The direct question feature has been removed from the UI
};

export default TrackPalService;
