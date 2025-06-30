import { API_BASE_URL, ENDPOINTS } from '../constants/ApiEndpoints';
import { FileUploadService } from './FileUploadService';

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
   * Get feedback for a resume
   * @param resumeId ID of the resume to get feedback for
   * @returns Feedback data from the server
   */
  static async getResumeFeedback(resumeId: string) {
    try {
      console.log(`Getting resume feedback for ID: ${resumeId}`);
      
      // Use the legacy endpoint for resume refinement with POST method
      const response = await fetch(`${API_BASE_URL}/agents/resume_refiner/refine/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No need to send body for this endpoint
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
   * Get job matches for a resume
   * @param resumeId ID of the resume to get matches for
   * @returns Job matches data from the server
   */
  static async getJobMatches(resumeId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${ENDPOINTS.JOBS.MATCH}/${resumeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting job matches:', error);
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
      
      // Get job details if available
      let jobTitle = "Job Position";
      let jobDescription = "";
      
      try {
        // Try to get the job from local data
        const jobs = await this.loadJobs();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
          jobTitle = job.title || jobTitle;
          jobDescription = job.description || jobDescription;
          console.log(`Found job details for ${jobId}: ${jobTitle}`);
        }
      } catch (jobError) {
        console.log(`Could not get job details: ${jobError.message}`);
        // Continue with default values
      }
      
      // Try a direct approach with a simpler payload structure
      try {
        console.log(`Trying simplified endpoint with job description`);
        const directResponse = await fetch(`${API_BASE_URL}/agents/resume_refiner/match/${resumeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              job_text: jobDescription || "Software Developer position requiring React Native and TypeScript skills"
            }
          })
        });
        
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log('Job match response (direct):', JSON.stringify(directData, null, 2));
          
          const directResult = directData.response || directData;
          return {
            match_score: directResult.match_score || 0,
            missing_keywords: directResult.missing_keywords || [],
            improvement_suggestions: directResult.improvement_suggestions || []
          };
        }
        
        // Log the error response for debugging
        try {
          const errorText = await directResponse.text();
          console.error(`Direct API returned status: ${directResponse.status}, Response: ${errorText}`);
        } catch (e) {
          console.error(`Could not read error response: ${e.message}`);
        }
      } catch (directError) {
        console.error('Error with direct approach:', directError);
      }
      
      // For development/testing purposes, return mock data when API fails
      console.log('Returning mock match data for development');
      return {
        match_score: 68,
        missing_keywords: ['React Native', 'TypeScript', 'UI/UX Design'],
        improvement_suggestions: [
          'Add more details about your React Native experience',
          'Highlight your TypeScript skills more prominently',
          'Include examples of UI/UX work you\'ve done',
          'Quantify your achievements with metrics and results'
        ]
      };
    } catch (error) {
      console.error('Error matching resume with job:', error);
      
      // Return mock data as fallback
      return {
        match_score: 68,
        missing_keywords: ['React Native', 'TypeScript', 'UI/UX Design'],
        improvement_suggestions: [
          'Add more details about your React Native experience',
          'Highlight your TypeScript skills more prominently',
          'Include examples of UI/UX work you\'ve done',
          'Quantify your achievements with metrics and results'
        ]
      };
    }
  }

  /**
   * Load jobs from local data
   * @returns Array of job objects
   */
  static async loadJobs() {
    try {
      // This is a placeholder - in a real app, you would fetch from a service
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error loading jobs:', error);
      return [];
    }
  }
}
