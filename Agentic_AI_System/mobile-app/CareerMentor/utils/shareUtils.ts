import { InterviewSummaryData } from '@/types/interview';
import { Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

/**
 * Formats interview review data into a shareable text format
 */
export const formatInterviewReviewForSharing = (data: InterviewSummaryData): string => {
  // Create a header
  let shareText = '📊 MockMate Interview Feedback 📊\n\n';
  
  // Add overall score
  shareText += `Overall Score: ${data.scores.overall}/10\n\n`;
  
  // Add score breakdown
  shareText += '🔍 Score Breakdown:\n';
  shareText += `• Technical Knowledge: ${data.scores.technical_knowledge}/10\n`;
  shareText += `• Problem Solving: ${data.scores.problem_solving}/10\n`;
  shareText += `• Communication: ${data.scores.communication}/10\n`;
  shareText += `• Cultural Fit: ${data.scores.cultural_fit}/10\n\n`;
  
  // Add strengths
  if (data.strengths && data.strengths.length > 0) {
    shareText += '💪 Strengths:\n';
    data.strengths.forEach(strength => {
      shareText += `• ${strength}\n`;
    });
    shareText += '\n';
  }
  
  // Add improvement areas
  if (data.improvement_areas && data.improvement_areas.length > 0) {
    shareText += '🚀 Areas for Improvement:\n';
    data.improvement_areas.forEach(area => {
      shareText += `• ${area}\n`;
    });
    shareText += '\n';
  }
  
  // Add recommendation
  if (data.recommendation) {
    shareText += `🏆 Recommendation: ${data.recommendation}\n\n`;
  }
  
  // Add app attribution
  shareText += 'Shared via CareerMentor App';
  
  return shareText;
};

/**
 * Shares interview review data using the native share dialog
 */
export const shareInterviewReview = async (data: InterviewSummaryData): Promise<void> => {
  try {
    const shareText = formatInterviewReviewForSharing(data);
    
    const result = await Share.share({
      message: shareText,
      title: 'My Interview Feedback',
    });
    
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared with activity type of result.activityType
        console.log(`Shared with ${result.activityType}`);
      } else {
        // Shared
        console.log('Shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      // Dismissed
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing interview review:', error);
  }
};

/**
 * Shares a screenshot of the interview review
 * @param uri The URI of the screenshot to share
 */
export const shareScreenshot = async (uri: string): Promise<void> => {
  try {
    if (Platform.OS === 'android') {
      // On Android, we need to save the file first
      const fileUri = `${FileSystem.cacheDirectory}interview_feedback_${Date.now()}.png`;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert('Sharing is not available on this device');
      }
    } else {
      // On iOS, we can share directly
      await Share.share({
        url: uri,
        title: 'My Interview Feedback',
      });
    }
  } catch (error) {
    console.error('Error sharing screenshot:', error);
  }
};

/**
 * Reference to the ViewShot component
 */
export type ViewShotRef = React.RefObject<ViewShot>;

/**
 * Captures a screenshot of a component and shares it
 * @param ref Reference to the ViewShot component
 */
export const captureAndShareScreenshot = async (ref: ViewShotRef): Promise<void> => {
  try {
    if (ref.current && typeof ref.current.capture === 'function') {
      // Capture the screenshot
      const uri = await ref.current.capture();
      // Share the screenshot
      await shareScreenshot(uri);
    } else {
      console.error('ViewShot reference is invalid or capture method is not available');
    }
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
};
