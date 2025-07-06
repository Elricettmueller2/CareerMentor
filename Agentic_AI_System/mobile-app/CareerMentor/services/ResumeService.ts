import { API_BASE_URL, ENDPOINTS, API_FALLBACK_URLS } from '../constants/ApiEndpoints';
import { FileUploadService } from './FileUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for resume-related operations
 */
export class ResumeService {
  /**
   * Upload a resume file (document or image)
   * @param uri File URI
   * @param fileName File name
   * @param fileType MIME type
   * @returns Analysis results from the server
   */
  static async uploadResume(uri: string, fileName: string, fileType: string) {
    try {
      // Use the FileUploadService to handle the upload with retry mechanism
      const response = await FileUploadService.uploadFileWithRetry(
        uri,
        fileName,
        fileType,
        ENDPOINTS.RESUME.UPLOAD
      );
      
      return response;
    } catch (error) {
      console.error('Resume upload error:', error);
      throw error;
    }
  }
  
  /**
   * Get layout analysis for a resume
   * @param resumeId ID of the resume to analyze
   * @returns Layout analysis data from the server
   */
  static async getResumeLayout(resumeId: string) {
    try {
      console.log(`Getting resume layout for ID: ${resumeId}`);
      
      const endpoint = ENDPOINTS.RESUME.ANALYZE.replace('{upload_id}', resumeId);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Resume layout API returned status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw resume layout response:', JSON.stringify(data, null, 2));
      
      return data.response || data;
    } catch (error) {
      console.error('Error getting resume layout:', error);
      throw error;
    }
  }
  
  /**
   * Parse a resume to extract text content
   * @param resumeId ID of the resume to parse
   * @returns Parsed text data from the server
   */
  static async parseResume(resumeId: string) {
    try {
      console.log(`Parsing resume with ID: ${resumeId}`);
      
      const endpoint = ENDPOINTS.RESUME.PARSE.replace('{upload_id}', resumeId);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Resume parse API returned status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw resume parse response:', JSON.stringify(data, null, 2));
      
      return data.response || data;
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback for a resume
   * @param resumeId ID of the resume to get feedback for
   * @returns Feedback data from the server
   */
  static async getResumeFeedback(resumeId: string) {
    try {
      console.log(`Getting resume feedback for ID: ${resumeId}`);
      
      // Use the new endpoint for resume evaluation
      const endpoint = ENDPOINTS.RESUME.EVALUATE.replace('{upload_id}', resumeId);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Resume feedback API returned status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw resume feedback response:', JSON.stringify(data, null, 2));
      
      // The backend returns { response: { scores: {...}, feedback: {...} } }
      const result = data.response || data;
      console.log('Extracted result object:', JSON.stringify(result, null, 2));
      
      // Check the actual structure of the result
      console.log('Result structure - has scores:', !!result.scores);
      console.log('Result structure - has feedback:', !!result.feedback);
      console.log('Result structure - feedback type:', result.feedback ? typeof result.feedback : 'undefined');
      if (result.feedback) {
        console.log('Result structure - feedback keys:', Object.keys(result.feedback));
      }
      
      // Keep the original backend category names
      const categoryMapping = {
        'format_layout': 'format_layout',
        'inhalt_struktur': 'inhalt_struktur',
        'sprache_stil': 'sprache_stil',
        'ergebnis_orientierung': 'ergebnis_orientierung',
        'overall': 'overall'
      };
      
      // Transform scores
      const categoryScores: Record<string, number> = {};
      if (result.scores) {
        console.log('Processing scores:', JSON.stringify(result.scores, null, 2));
        Object.entries(result.scores).forEach(([backendCategory, score]) => {
          const frontendCategory = categoryMapping[backendCategory] || backendCategory;
          categoryScores[frontendCategory] = typeof score === 'number' ? score : 0;
        });
        console.log('Transformed category scores:', categoryScores);
      } else {
        console.warn('No scores found in the response');
      }
      
      // Transform feedback into array format expected by the component
      const feedbackMessagesArray: Array<{section: string, text: string}> = [];
      if (result.feedback) {
        console.log('Processing feedback:', JSON.stringify(result.feedback, null, 2));
        Object.entries(result.feedback).forEach(([backendCategory, messages]) => {
          const frontendCategory = categoryMapping[backendCategory] || backendCategory;
          console.log(`Processing category ${backendCategory} -> ${frontendCategory}, messages:`, messages);
          if (Array.isArray(messages)) {
            messages.forEach(message => {
              feedbackMessagesArray.push({
                section: frontendCategory,
                text: message
              });
            });
          } else if (typeof messages === 'string') {
            // Handle case where feedback might be a string instead of array
            feedbackMessagesArray.push({
              section: frontendCategory,
              text: messages
            });
          } else {
            console.warn(`Unexpected format for feedback in category ${backendCategory}:`, messages);
          }
        });
      } else {
        console.warn('No feedback found in the response');
      }
      
      console.log('Final transformed feedback array:', feedbackMessagesArray);
      
      return {
        categoryScores: {
          overall: categoryScores.overall || 0,
          format_layout: categoryScores.format_layout || 0,
          inhalt_struktur: categoryScores.inhalt_struktur || 0,
          sprache_stil: categoryScores.sprache_stil || 0,
          ergebnis_orientierung: categoryScores.ergebnis_orientierung || 0,
        },
        feedbackMessages: feedbackMessagesArray
      };
    } catch (error) {
      console.error('Error getting resume feedback:', error);
      throw error;
    }
  }
  
  /**
   * Match a resume with a specific job
   * @param resumeId ID of the resume to match
   * @param jobId ID of the job to match with
   * @returns Match results including score, missing keywords, and improvement suggestions
   */
  static async matchResumeWithJob(resumeId: string, jobId: string) {
    try {
      console.log(`Matching resume ${resumeId} with job ${jobId}`);
      
      // Get the user ID from AsyncStorage (default to "default_user" if not found)
      const userId = await AsyncStorage.getItem('userId') || 'default_user';
      
      // Use the endpoint that matches with saved jobs from MongoDB
      const endpoint = `/resume/match-saved-jobs/${resumeId}/${userId}`;
      
      console.log(`Calling resume match API with saved jobs: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`Resume match API returned status: ${response.status}`);
        
        // Log the error response for debugging
        try {
          const errorText = await response.text();
          console.error(`API error response: ${errorText}`);
        } catch (e) {
          console.error(`Could not read error response: ${e.message}`);
        }
        
        // Try fallback URLs if the main API fails
        for (const fallbackUrl of API_FALLBACK_URLS) {
          try {
            console.log(`Trying fallback URL: ${fallbackUrl}${endpoint}`);
            const fallbackResponse = await fetch(`${fallbackUrl}${endpoint}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log('Fallback job match response:', JSON.stringify(fallbackData, null, 2));
              
              // Find the job match for the specific job ID
              const jobMatches = fallbackData.data || [];
              const jobMatch = jobMatches.find(match => match.id === jobId || match.job_id === jobId);
              
              if (!jobMatch) {
                throw new Error(`Job with ID ${jobId} not found in match results`);
              }
              
              return {
                match_score: jobMatch.overall_score || jobMatch.skill_match_percentage || 0,
                missing_keywords: jobMatch.missing_skills || [],
                improvement_suggestions: jobMatch.improvement_suggestions || []
              };
            }
          } catch (fallbackError) {
            console.error(`Fallback URL failed: ${fallbackError.message}`);
            // Continue to the next fallback URL
          }
        }
        
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Job match response:', JSON.stringify(data, null, 2));
      
      // Find the job match for the specific job ID
      const jobMatches = data.data || [];
      const jobMatch = jobMatches.find(match => match.id === jobId || match.job_id === jobId);
      
      if (!jobMatch) {
        throw new Error(`Job with ID ${jobId} not found in match results`);
      }
      
      // Validate the result to ensure we have actual data
      if (!jobMatch || (typeof jobMatch.overall_score !== 'number' && typeof jobMatch.skill_match_percentage !== 'number')) {
        console.error('Invalid match result format:', jobMatch);
        throw new Error('Invalid match result format from API');
      }
      
      return {
        match_score: jobMatch.overall_score || jobMatch.skill_match_percentage || 0,
        missing_keywords: jobMatch.missing_skills || [],
        improvement_suggestions: jobMatch.improvement_suggestions || []
      };
    } catch (error) {
      console.error('Error matching resume with job:', error);
      
      // Instead of returning mock data, throw the error to show a proper error message
      throw new Error(`Failed to match resume with job: ${error.message}`);
    }
  }
  
  /**
   * Load jobs from local data
   * @returns Array of job objects
   */
  static async loadJobs() {
    try {
      // Use the dataLoader utility to load jobs from the mock global state
      const { loadJobs } = await import('../utils/dataLoader');
      return await loadJobs();
    } catch (error) {
      console.error('Error loading jobs:', error);
      return [];
    }
  }
  
  /**
   * Get saved jobs for a user from MongoDB
   * @returns Array of saved job objects
   */
  static async getSavedJobs() {
    try {
      // Get the user ID from AsyncStorage (default to "default_user" if not found)
      const userId = await AsyncStorage.getItem('userId') || 'default_user';
      
      // Endpoint to get saved jobs from MongoDB for ResumeRefiner
      const endpoint = `/resume/saved-jobs/${userId}`;
      
      console.log(`Fetching saved jobs for ResumeRefiner: ${API_BASE_URL}${endpoint}`);
      
      // Try to fetch jobs from the main API
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`Saved jobs API returned status: ${response.status}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Saved jobs response:', JSON.stringify(data, null, 2));
        
        if (!data.data || !Array.isArray(data.data)) {
          console.warn('API returned invalid data format:', data);
          throw new Error('Invalid data format received from API');
        }
        
        // Transform the saved jobs to match our Job interface
        return data.data.map(job => ({
          id: job.id,
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          skills: job.skills || [],
          match: job.match_score || 0
        }));
      } catch (apiError) {
        console.error('Error fetching saved jobs from main API:', apiError);
        
        // Try fallback URLs if the main API fails
        for (const fallbackUrl of API_FALLBACK_URLS) {
          try {
            console.log(`Trying fallback URL: ${fallbackUrl}${endpoint}`);
            const fallbackResponse = await fetch(`${fallbackUrl}${endpoint}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              console.log('Saved jobs fetched successfully from fallback:', data);
              
              if (!data.data || !Array.isArray(data.data)) {
                console.warn('Fallback API returned invalid data format:', data);
                continue;
              }
              
              // Transform the saved jobs to match our Job interface
              return data.data.map(job => ({
                id: job.id,
                title: job.title || '',
                company: job.company || '',
                location: job.location || '',
                description: job.description || '',
                skills: job.skills || [],
                match: job.match_score || 0
              }));
            }
          } catch (fallbackError) {
            console.error(`Fallback URL failed: ${fallbackError.message}`);
            // Continue to the next fallback URL
          }
        }
        
        // If all API calls fail, fall back to mock data with a warning
        console.warn('All API calls failed, falling back to mock data');
        return this.loadJobs();
      }
    } catch (error) {
      console.error('Error getting saved jobs:', error);
      return [];
    }
  }
}
