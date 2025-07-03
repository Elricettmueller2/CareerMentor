import { InterviewSummaryData } from '@/types/interview';
import { Share, Platform, Alert } from 'react-native';
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
  console.log('[DEBUG] shareInterviewReview - Starting share process');
  try {
    console.log('[DEBUG] shareInterviewReview - Formatting text');
    const shareText = formatInterviewReviewForSharing(data);
    console.log('[DEBUG] shareInterviewReview - Text formatted successfully');
    
    console.log('[DEBUG] shareInterviewReview - Calling Share.share API');
    const result = await Share.share({
      message: shareText,
      title: 'My Interview Feedback',
    });
    console.log('[DEBUG] shareInterviewReview - Share.share API returned', result);
    
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared with activity type of result.activityType
        console.log(`[DEBUG] shareInterviewReview - Shared with ${result.activityType}`);
      } else {
        // Shared
        console.log('[DEBUG] shareInterviewReview - Shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      // Dismissed
      console.log('[DEBUG] shareInterviewReview - Share dismissed');
    }
  } catch (error) {
    console.error('[DEBUG] shareInterviewReview - Error sharing interview review:', error);
    Alert.alert('Sharing Error', 'Failed to share interview review. Please try again.');
  }
};

/**
 * Shares a screenshot of the interview review
 * @param uri The URI of the screenshot to share
 */
export const shareScreenshot = async (uri: string): Promise<void> => {
  console.log('[DEBUG] shareScreenshot - Starting with URI:', uri ? 'URI exists' : 'URI is null or empty');
  try {
    if (Platform.OS === 'android') {
      console.log('[DEBUG] shareScreenshot - Android path');
      // On Android, we need to save the file first
      const fileUri = `${FileSystem.cacheDirectory}interview_feedback_${Date.now()}.png`;
      console.log('[DEBUG] shareScreenshot - Target file URI:', fileUri);
      
      console.log('[DEBUG] shareScreenshot - Copying file');
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });
      console.log('[DEBUG] shareScreenshot - File copied successfully');
      
      // Check if sharing is available
      console.log('[DEBUG] shareScreenshot - Checking if sharing is available');
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('[DEBUG] shareScreenshot - Sharing available:', isAvailable);
      
      if (isAvailable) {
        console.log('[DEBUG] shareScreenshot - Calling Sharing.shareAsync');
        await Sharing.shareAsync(fileUri);
        console.log('[DEBUG] shareScreenshot - Sharing completed');
      } else {
        console.log('[DEBUG] shareScreenshot - Sharing not available');
        Alert.alert('Sharing Error', 'Sharing is not available on this device');
      }
    } else {
      console.log('[DEBUG] shareScreenshot - iOS path');
      // On iOS, we can share directly
      console.log('[DEBUG] shareScreenshot - Calling Share.share');
      await Share.share({
        url: uri,
        title: 'My Interview Feedback',
      });
      console.log('[DEBUG] shareScreenshot - iOS sharing completed');
    }
  } catch (error) {
    console.error('[DEBUG] shareScreenshot - Error sharing screenshot:', error);
    Alert.alert('Sharing Error', 'Failed to share screenshot. Please try again.');
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
  console.log('[DEBUG] captureAndShareScreenshot - Starting');
  try {
    console.log('[DEBUG] captureAndShareScreenshot - Checking ref:', ref ? 'Ref exists' : 'Ref is null');
    console.log('[DEBUG] captureAndShareScreenshot - Ref current:', ref.current ? 'Current exists' : 'Current is null');
    
    if (ref.current && typeof ref.current.capture === 'function') {
      console.log('[DEBUG] captureAndShareScreenshot - Capture method exists, capturing screenshot');
      // Capture the screenshot
      const uri = await ref.current.capture();
      console.log('[DEBUG] captureAndShareScreenshot - Screenshot captured, URI:', uri ? 'URI exists' : 'URI is null');
      
      // Share the screenshot
      console.log('[DEBUG] captureAndShareScreenshot - Calling shareScreenshot');
      await shareScreenshot(uri);
      console.log('[DEBUG] captureAndShareScreenshot - Sharing completed');
    } else {
      console.error('[DEBUG] captureAndShareScreenshot - ViewShot reference is invalid or capture method is not available');
      Alert.alert('Sharing Error', 'Cannot capture screenshot. The view reference is invalid.');
    }
  } catch (error) {
    console.error('[DEBUG] captureAndShareScreenshot - Error capturing screenshot:', error);
    Alert.alert('Sharing Error', 'Failed to capture screenshot. Please try again.');
  }
};
