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

  // Parse pattern analysis text into structured insights
  parsePatternInsights: (analysisText: string): PatternInsight[] => {
    if (!analysisText || analysisText.trim() === '' || 
        analysisText.includes('No pattern analysis available') || 
        analysisText.includes('Failed to analyze patterns')) {
      return [];
    }

    try {
      // Extract meaningful insights from the analysis text
      const insights: PatternInsight[] = [];
      
      // Extract key insights from the text
      // These patterns are likely to contain actionable insights
      const insightPatterns = [
        // Success patterns
        { regex: /success rate for ([^.]+)/i, icon: 'stats-chart' },
        { regex: /([^.]+) higher response rate/i, icon: 'trending-up' },
        { regex: /([^.]+) yielded ([^.]+) interview/i, icon: 'people' },
        
        // Focus recommendations
        { regex: /focus (more )?on ([^.]+)/i, icon: 'target' },
        { regex: /specialize in ([^.]+)/i, icon: 'target' },
        { regex: /streamline ([^.]+)/i, icon: 'funnel' },
        
        // Skill recommendations
        { regex: /highlight ([^.]+) skills/i, icon: 'school' },
        { regex: /expand ([^.]+) skills/i, icon: 'school' },
        { regex: /improve ([^.]+)/i, icon: 'trending-up' },
        
        // Application strategy
        { regex: /follow[- ]up ([^.]+)/i, icon: 'mail' },
        { regex: /reach out ([^.]+)/i, icon: 'call' },
        { regex: /wait ([^.]+) before/i, icon: 'time' },
      ];
      
      // Process the text to find actionable insights
      const paragraphs = analysisText.split('\n\n').filter(p => p.trim() !== '');
      
      // First look for bullet points which are often recommendations
      const bulletPoints = analysisText.match(/[\*\-•]\s+([^\n]+)/g) || [];
      const recommendations = analysisText.match(/recommend[^.:\n]+([^.]+)/gi) || [];
      const suggestions = analysisText.match(/suggest[^.:\n]+([^.]+)/gi) || [];
      
      // Combine all potential insights
      const potentialInsights = [
        ...bulletPoints.map(bp => bp.trim()),
        ...recommendations.map(r => r.trim()),
        ...suggestions.map(s => s.trim())
      ];
      
      // If we have bullet points or explicit recommendations, use those
      if (potentialInsights.length > 0) {
        // Take up to 3 most relevant insights
        const bestInsights = potentialInsights
          .filter(insight => 
            insight.length > 20 && 
            insight.length < 120 && 
            !insight.includes('Thought:') && 
            !insight.includes('Analysis:')
          )
          .slice(0, 3);
        
        bestInsights.forEach((insight, index) => {
          // Clean up the insight text
          let content = insight.replace(/^\s*[\*\-•]\s*/, '').trim();
          
          // Remove any leading phrases that make it less direct
          content = content
            .replace(/^I (would )?suggest that (you )?/i, '')
            .replace(/^I (would )?recommend that (you )?/i, '')
            .replace(/^You (may|should|could) /i, '')
            .replace(/^Based on [^,]+, /i, '')
            .trim();
          
          // Ensure first letter is capitalized
          content = content.charAt(0).toUpperCase() + content.slice(1);
          
          // Assign an appropriate icon
          let icon = 'analytics';
          
          // Choose icon based on content keywords
          if (content.match(/focus|target|specific|area/i)) {
            icon = 'target';
          } else if (content.match(/skill|learn|education|knowledge/i)) {
            icon = 'school';
          } else if (content.match(/follow|email|contact|reach out/i)) {
            icon = 'mail';
          } else if (content.match(/time|wait|schedule|day|week/i)) {
            icon = 'time';
          } else if (content.match(/company|employer|industry|business/i)) {
            icon = 'business';
          } else if (content.match(/search|find|look|seek/i)) {
            icon = 'search';
          } else if (content.match(/interview|conversation|talk/i)) {
            icon = 'people';
          } else if (content.match(/resume|cv|application|document/i)) {
            icon = 'document-text';
          }
          
          insights.push({
            id: (index + 1).toString(),
            icon,
            content
          });
        });
      }
      
      // If we couldn't find good insights from bullets/recommendations,
      // try to extract insights using our patterns
      if (insights.length === 0) {
        // Go through each paragraph and try to extract insights
        for (const paragraph of paragraphs) {
          for (const pattern of insightPatterns) {
            const match = paragraph.match(pattern.regex);
            if (match) {
              // Extract the relevant part of the match
              let content = match[0];
              
              // Make it more actionable if possible
              if (content.toLowerCase().startsWith('focus')) {
                // Already actionable
              } else if (content.toLowerCase().includes('success rate')) {
                content = `Focus on ${match[1]} to improve success rate`;
              } else if (content.toLowerCase().includes('higher response')) {
                content = `Target ${match[1]} for better responses`;
              } else if (content.toLowerCase().includes('yielded')) {
                content = `Continue applying for ${match[1]} positions`;
              } else {
                // Make other insights more actionable
                content = content.charAt(0).toUpperCase() + content.slice(1);
              }
              
              // Ensure it's not too long
              if (content.length > 100) {
                content = content.substring(0, 97) + '...';
              }
              
              insights.push({
                id: `insight-${insights.length + 1}`,
                icon: pattern.icon,
                content
              });
              
              // Limit to 3 insights
              if (insights.length >= 3) break;
            }
          }
          if (insights.length >= 3) break;
        }
      }
      
      // If we still don't have insights, extract key sentences that might be valuable
      if (insights.length === 0) {
        const sentences = analysisText.split(/[.!?]\s+/).filter(s => 
          s.length > 30 && 
          s.length < 120 && 
          (s.includes('application') || s.includes('job') || s.includes('position') || s.includes('interview')) &&
          !s.includes('Thought:') && 
          !s.includes('Analysis:')
        );
        
        // Take up to 3 most relevant sentences
        const bestSentences = sentences.slice(0, 3);
        
        bestSentences.forEach((sentence, index) => {
          let content = sentence.trim();
          content = content.charAt(0).toUpperCase() + content.slice(1);
          
          // Choose icon based on content
          let icon = 'analytics';
          if (content.match(/focus|target|specific|area/i)) {
            icon = 'target';
          } else if (content.match(/skill|learn|education|knowledge/i)) {
            icon = 'school';
          } else if (content.match(/follow|email|contact|reach out/i)) {
            icon = 'mail';
          } else if (content.match(/time|wait|schedule|day|week/i)) {
            icon = 'time';
          } else if (content.match(/company|employer|industry|business/i)) {
            icon = 'business';
          } else if (content.match(/search|find|look|seek/i)) {
            icon = 'search';
          }
          
          insights.push({
            id: (index + 1).toString(),
            icon,
            content
          });
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error parsing pattern insights:', error);
      return [];
    }
  },

  // Get application pattern analysis
  getPatternAnalysis: async (userId?: string): Promise<string> => {
    try {
      const actualUserId = userId || await TrackPalService.getUserId();
      console.log('Calling analyze_patterns with userId:', actualUserId);
      
      return await tryAPIUrls(async (baseUrl) => {
        console.log('API URL:', `${baseUrl}/analyze_patterns`);
        
        const response = await axios.post(`${baseUrl}/analyze_patterns`, {
          data: { user_id: actualUserId } // Wrap in data object to match AgentRequest model
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

  // Get pattern insights from the AI agent
  getPatternInsights: async (userId?: string): Promise<PatternInsight[]> => {
    try {
      // Get the raw pattern analysis text
      const analysisText = await TrackPalService.getPatternAnalysis(userId);
      
      // Check if we have enough data for meaningful insights
      if (!analysisText || 
          analysisText.includes('No pattern analysis available') || 
          analysisText.includes('Failed to analyze patterns') ||
          analysisText.length < 100) {
        return [{
          id: 'default-1',
          icon: 'information-circle',
          content: 'Add more applications to get personalized insights about your job search patterns.'
        }];
      }
      
      // Parse the text into structured insights
      const insights = TrackPalService.parsePatternInsights(analysisText);
      
      // If we couldn't extract good insights, create a default one asking for more data
      if (insights.length === 0) {
        return [{
          id: 'default-1',
          icon: 'information-circle',
          content: 'Add more applications to get personalized insights about your job search patterns.'
        }];
      }
      
      return insights;
    } catch (error) {
      console.error('Error getting pattern insights:', error);
      return [];
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
