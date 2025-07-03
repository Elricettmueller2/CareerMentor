import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, Platform, Modal, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { InterviewSummaryData } from '@/types/interview';
import ReviewCard from '@/components/interview/ReviewCard';
import { Ionicons } from '@expo/vector-icons';
import { shareInterviewReview, captureAndShareScreenshot, ViewShotRef } from '@/utils/shareUtils';
import ViewShot from 'react-native-view-shot';

// API base URLs for different environments
const API_URLS = {
  emulator: 'http://10.0.2.2:8000', // Android emulator
  localhost: 'http://localhost:8000', // iOS simulator or web
  device: 'http://192.168.1.218:8000' // Physical device
};

// Select appropriate API URL based on platform
const API_BASE_URL = Platform.OS === 'android' ? API_URLS.emulator : API_URLS.localhost;

// Log platform and API URL for debugging
console.log(`[DEBUG] Platform: ${Platform.OS}, Using API URL: ${API_BASE_URL}`);

const InterviewReviewScreen = () => {
  const { sessionId, interviewType } = useLocalSearchParams();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<InterviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Reference to the ViewShot component for screenshot capture
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided.');
      setLoading(false);
      return;
    }

    const fetchReview = async () => {
      try {
        console.log(`[DEBUG] Platform: ${Platform.OS}, API URL: ${API_BASE_URL}`);
        console.log(`[DEBUG] Fetching review with session ID: ${sessionId}`);
        
        const requestBody = {
          data: { session_id: sessionId },
        };
        console.log(`[DEBUG] Request body: ${JSON.stringify(requestBody)}`);
        
        // Add a small delay on iOS to ensure network is ready
        if (Platform.OS === 'ios') {
          console.log('[DEBUG] iOS platform detected, adding small delay before fetch');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const response = await fetch(`${API_BASE_URL}/agents/mock_mate/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log(`[DEBUG] Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
        }

        const responseText = await response.text();
        console.log(`[DEBUG] Raw response text length: ${responseText.length}`);
        console.log(`[DEBUG] Raw response text (first 100 chars): ${responseText.substring(0, 100)}...`);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('[DEBUG] Successfully parsed response JSON');
          console.log(`[DEBUG] Response data structure: ${Object.keys(responseData).join(', ')}`);
        } catch (jsonError) {
          console.error('[ERROR] Failed to parse response as JSON:', jsonError);
          setReviewData({
            scores: {
              technical_knowledge: 0,
              problem_solving: 0,
              communication: 0,
              cultural_fit: 0,
              overall: 0
            },
            strengths: [],
            improvement_areas: [],
            specific_feedback: '',
            recommendation: 'Consider' as 'Hire' | 'Consider' | 'Reject',
          });
          setLoading(false);
          return;
        }
        
        let formattedData: InterviewSummaryData = {
          scores: {
            technical_knowledge: 0,
            problem_solving: 0,
            communication: 0,
            cultural_fit: 0,
            overall: 0
          },
          strengths: [],
          improvement_areas: [],
          specific_feedback: '',
          recommendation: 'Consider' as 'Hire' | 'Consider' | 'Reject',
        };

        console.log('[DEBUG] Attempting to extract review data from response');
        console.log(`[DEBUG] Response data type: ${typeof responseData}`);
        
        // Check if the response has a 'response' field that contains the review (from logs we see this is the case)
        if (responseData.response) {
          console.log('[DEBUG] Found response field in responseData');
          console.log(`[DEBUG] Response field type: ${typeof responseData.response}`);
          
          // Some APIs return the review as a JSON string that needs to be parsed again
          if (typeof responseData.response === 'string') {
            try {
              console.log('[DEBUG] Attempting to parse response string as JSON');
              console.log(`[DEBUG] Response string (first 50 chars): ${responseData.response.substring(0, 50)}...`);
              
              // Try to fix potentially incomplete JSON by ensuring it's properly terminated
              let jsonString = responseData.response;
              // Check if the string appears to be cut off
              if (!jsonString.trim().endsWith('}') && !jsonString.trim().endsWith(']')) {
                console.log('[DEBUG] JSON string appears incomplete, attempting to fix');
                // Try to extract just the scores object which appears to be complete
                const scoresMatch = jsonString.match(/"scores"\s*:\s*\{[^\}]*\}/g);
                if (scoresMatch && scoresMatch[0]) {
                  console.log('[DEBUG] Extracted scores object from incomplete JSON');
                  try {
                    // Create a minimal valid JSON with just the scores
                    const minimalJson = `{${scoresMatch[0]}}`;
                    const parsedScores = JSON.parse(minimalJson);
                    responseData = { scores: parsedScores.scores };
                    console.log('[DEBUG] Successfully parsed scores from incomplete JSON');
                  } catch (scoreParseError) {
                    console.error('[ERROR] Failed to parse extracted scores:', scoreParseError);
                  }
                }
              } else {
                // Try normal parsing if the JSON appears complete
                const parsedResponse = JSON.parse(jsonString);
                responseData = parsedResponse;
                console.log('[DEBUG] Successfully parsed response string');
                console.log(`[DEBUG] Parsed response structure: ${Object.keys(parsedResponse).join(', ')}`);
              }
            } catch (responseParseError) {
              console.error('[ERROR] Failed to parse response string:', responseParseError);
              // Try to extract scores directly from the string using regex
              try {
                console.log('[DEBUG] Attempting to extract scores using regex');
                const technicalMatch = responseData.response.match(/"technical_knowledge"\s*:\s*(\d+)/i);
                const problemSolvingMatch = responseData.response.match(/"problem_solving"\s*:\s*(\d+)/i);
                const communicationMatch = responseData.response.match(/"communication"\s*:\s*(\d+)/i);
                const culturalFitMatch = responseData.response.match(/"cultural_fit"\s*:\s*(\d+)/i);
                const overallMatch = responseData.response.match(/"overall"\s*:\s*(\d+)/i);
                
                if (technicalMatch || problemSolvingMatch || communicationMatch || culturalFitMatch || overallMatch) {
                  console.log('[DEBUG] Successfully extracted some scores using regex');
                  responseData.scores = {
                    technical_knowledge: technicalMatch ? parseInt(technicalMatch[1], 10) : 0,
                    problem_solving: problemSolvingMatch ? parseInt(problemSolvingMatch[1], 10) : 0,
                    communication: communicationMatch ? parseInt(communicationMatch[1], 10) : 0,
                    cultural_fit: culturalFitMatch ? parseInt(culturalFitMatch[1], 10) : 0,
                    overall: overallMatch ? parseInt(overallMatch[1], 10) : 0
                  };
                }
                
                // Try to extract specific feedback using regex
                const feedbackMatch = responseData.response.match(/"specific_feedback"\s*:\s*"([^"]*)"/i);
                if (feedbackMatch && feedbackMatch[1]) {
                  console.log('[DEBUG] Successfully extracted specific_feedback using regex');
                  responseData.specific_feedback = feedbackMatch[1];
                }
              } catch (regexError) {
                console.error('[ERROR] Failed to extract data using regex:', regexError);
              }
            }
          } else if (typeof responseData.response === 'object') {
            console.log('[DEBUG] Response field is already an object');
            console.log(`[DEBUG] Response object keys: ${Object.keys(responseData.response).join(', ')}`);
            responseData = responseData.response;
          }
        }
        
        // Check if the response has a 'data' field that contains the review
        if (responseData.data && typeof responseData.data === 'object') {
          console.log('[DEBUG] Found data object in response');
          responseData = responseData.data;
        }

        // Check if the response has a 'review' field that contains the review
        if (responseData.review) {
          console.log('[DEBUG] Found review field in response');
          console.log(`[DEBUG] Review field type: ${typeof responseData.review}`);
          
          // Some APIs return the review as a JSON string that needs to be parsed again
          if (typeof responseData.review === 'string') {
            try {
              console.log('[DEBUG] Attempting to parse review string as JSON');
              console.log(`[DEBUG] Review string (first 50 chars): ${responseData.review.substring(0, 50)}...`);
              const parsedReview = JSON.parse(responseData.review);
              responseData = parsedReview;
              console.log('[DEBUG] Successfully parsed review string');
              console.log(`[DEBUG] Parsed review structure: ${Object.keys(parsedReview).join(', ')}`);
            } catch (reviewParseError) {
              console.error('[ERROR] Failed to parse review string:', reviewParseError);
              // Keep the original responseData if parsing fails
            }
          } else if (typeof responseData.review === 'object') {
            console.log('[DEBUG] Review field is already an object');
            console.log(`[DEBUG] Review object keys: ${Object.keys(responseData.review).join(', ')}`);
            responseData = responseData.review;
          }
        }

        // Extract scores
        if (responseData.scores && typeof responseData.scores === 'object') {
          console.log('[DEBUG] Found scores in response');
          console.log(`[DEBUG] Score keys: ${Object.keys(responseData.scores).join(', ')}`);
          
          // Ensure all required score fields are present
          formattedData.scores = {
            technical_knowledge: responseData.scores.technical_knowledge || 0,
            problem_solving: responseData.scores.problem_solving || 0,
            communication: responseData.scores.communication || 0,
            cultural_fit: responseData.scores.cultural_fit || 0,
            overall: responseData.scores.overall || 0
          };
        }

        // Extract strengths
        if (Array.isArray(responseData.strengths)) {
          console.log(`[DEBUG] Found strengths array with ${responseData.strengths.length} items`);
          if (responseData.strengths.length > 0) {
            console.log(`[DEBUG] First strength: ${responseData.strengths[0]}`);
          }
          formattedData.strengths = responseData.strengths;
        }

        // Extract improvement areas
        if (Array.isArray(responseData.improvement_areas)) {
          console.log(`[DEBUG] Found improvement_areas array with ${responseData.improvement_areas.length} items`);
          if (responseData.improvement_areas.length > 0) {
            console.log(`[DEBUG] First improvement area: ${responseData.improvement_areas[0]}`);
          }
          formattedData.improvement_areas = responseData.improvement_areas;
        }

        // Extract specific feedback - try multiple possible locations based on API response format
        let specificFeedback = null;
        
        // Try direct specific_feedback field
        if (typeof responseData.specific_feedback === 'string') {
          console.log(`[DEBUG] Found direct specific_feedback with length ${responseData.specific_feedback.length}`);
          specificFeedback = responseData.specific_feedback;
        }
        // Try feedback field (alternative name)
        else if (typeof responseData.feedback === 'string') {
          console.log(`[DEBUG] Found feedback field with length ${responseData.feedback.length}`);
          specificFeedback = responseData.feedback;
        }
        // Try detailed_feedback field (another alternative name)
        else if (typeof responseData.detailed_feedback === 'string') {
          console.log(`[DEBUG] Found detailed_feedback field with length ${responseData.detailed_feedback.length}`);
          specificFeedback = responseData.detailed_feedback;
        }
        // Try comments field (another possible field name)
        else if (typeof responseData.comments === 'string') {
          console.log(`[DEBUG] Found comments field with length ${responseData.comments.length}`);
          specificFeedback = responseData.comments;
        }
        // If we have a feedback object with a text field
        else if (responseData.feedback && typeof responseData.feedback.text === 'string') {
          console.log(`[DEBUG] Found feedback.text field with length ${responseData.feedback.text.length}`);
          specificFeedback = responseData.feedback.text;
        }
        // If we have a feedback object with a content field
        else if (responseData.feedback && typeof responseData.feedback.content === 'string') {
          console.log(`[DEBUG] Found feedback.content field with length ${responseData.feedback.content.length}`);
          specificFeedback = responseData.feedback.content;
        }
        // Try to extract feedback from the raw response if we still don't have it
        else if (responseText && responseText.includes('specific_feedback')) {
          console.log('[DEBUG] Attempting to extract feedback from raw response text');
          try {
            // Look for specific_feedback in the raw response
            const feedbackMatch = responseText.match(/"specific_feedback"\s*:\s*"([^"]*)"/i);
            if (feedbackMatch && feedbackMatch[1]) {
              console.log('[DEBUG] Found specific_feedback in raw response');
              specificFeedback = feedbackMatch[1];
            } else {
              // Try to find any paragraph that might be feedback
              const paragraphMatch = responseText.match(/"([^"]{30,})"/); // Look for longer quoted strings
              if (paragraphMatch && paragraphMatch[1]) {
                console.log('[DEBUG] Found potential feedback paragraph in raw response');
                specificFeedback = paragraphMatch[1];
              }
            }
          } catch (regexError) {
            console.error('[ERROR] Failed to extract feedback from raw response:', regexError);
          }
        }
        
        // Set the feedback in the formatted data
        if (specificFeedback && specificFeedback.length > 0) {
          console.log(`[DEBUG] Using specific feedback with length ${specificFeedback.length}`);
          formattedData.specific_feedback = specificFeedback;
        } else {
          console.log('[DEBUG] No valid specific feedback found, setting default message');
          formattedData.specific_feedback = 'No specific feedback provided for this interview.';
        }

        // Extract recommendation
        if (typeof responseData.recommendation === 'string') {
          console.log(`[DEBUG] Found recommendation with length ${responseData.recommendation.length}`);
          // Ensure recommendation is one of the valid values
          const validRecommendations = ['Hire', 'Consider', 'Reject'];
          const recommendationValue = responseData.recommendation.trim();
          
          // Check for exact matches first
          if (validRecommendations.includes(recommendationValue)) {
            formattedData.recommendation = recommendationValue as 'Hire' | 'Consider' | 'Reject';
          } 
          // Check for partial matches or keywords in the recommendation
          else if (recommendationValue.toLowerCase().includes('hire') || 
                   recommendationValue.toLowerCase().includes('strong') || 
                   recommendationValue.toLowerCase().includes('yes')) {
            console.log(`[DEBUG] Recommendation contains 'hire' keyword, using 'Hire'`);
            formattedData.recommendation = 'Hire';
          } 
          else if (recommendationValue.toLowerCase().includes('reject') || 
                   recommendationValue.toLowerCase().includes('no') || 
                   recommendationValue.toLowerCase().includes('not suitable')) {
            console.log(`[DEBUG] Recommendation contains 'reject' keyword, using 'Reject'`);
            formattedData.recommendation = 'Reject';
          } 
          else {
            console.log(`[DEBUG] Using default 'Consider' for recommendation: ${recommendationValue.substring(0, 30)}...`);
            formattedData.recommendation = 'Consider';
          }
        } 
        // Try to extract recommendation from raw response if not found
        else if (responseText) {
          console.log('[DEBUG] Attempting to extract recommendation from raw response');
          const rawText = responseText.toLowerCase();
          if (rawText.includes('"recommendation"') || rawText.includes('recommendation:')) {
            if ((rawText.includes('hire') && !rawText.includes('not hire')) || 
                rawText.includes('strong candidate')) {
              console.log('[DEBUG] Found hire recommendation in raw text');
              formattedData.recommendation = 'Hire';
            } else if (rawText.includes('reject') || 
                      rawText.includes('not suitable') || 
                      rawText.includes('not recommend')) {
              console.log('[DEBUG] Found reject recommendation in raw text');
              formattedData.recommendation = 'Reject';
            } else {
              console.log('[DEBUG] Using default Consider recommendation from raw text');
              formattedData.recommendation = 'Consider';
            }
          } else {
            console.log('[DEBUG] recommendation not found in raw text');
            formattedData.recommendation = 'Consider';
          }
        } else {
          console.log('[DEBUG] recommendation not found or not a string');
          formattedData.recommendation = 'Consider';
        }

        console.log('[DEBUG] Setting formatted review data');
        console.log('[DEBUG] Final formatted data structure:', JSON.stringify({
          hasScores: Object.keys(formattedData.scores).length > 0,
          strengthsCount: formattedData.strengths.length,
          improvementAreasCount: formattedData.improvement_areas.length,
          hasFeedback: formattedData.specific_feedback.length > 0,
          hasRecommendation: formattedData.recommendation.length > 0,
        }));
        
        // On iOS, ensure we're not setting state during an unmounted component
        if (Platform.OS === 'ios') {
          console.log('[DEBUG] iOS platform - using timeout before setState');
          setTimeout(() => {
            setReviewData(formattedData);
            setLoading(false);
          }, 100);
        } else {
          setReviewData(formattedData);
          setLoading(false);
        }
      } catch (e: any) {
        console.error('[ERROR] Failed to load review:', e);
        console.error('[ERROR] Error stack:', e.stack);
        setError(`Failed to load review: ${e.message}`);
        setLoading(false);
      }
    };

    fetchReview();
  }, [sessionId]);

  const handleStartNewInterview = () => {
    // Use push instead of replace to avoid tab bar issues
    router.push('/(tabs)/interview');
  };

  // Log render state for debugging
  console.log('[DEBUG] Rendering InterviewReviewScreen');
  console.log('[DEBUG] Loading state:', loading);
  console.log('[DEBUG] Error state:', error ? 'Error: ' + error : 'No error');
  console.log('[DEBUG] Review data state:', reviewData ? 'Has data' : 'No data');
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.midnight} />
        </TouchableOpacity>
        <Text style={styles.title}>Interview Review</Text>
        {reviewData ? (
          <TouchableOpacity style={styles.shareButton} onPress={() => setShowShareOptions(true)}>
            <Ionicons name="share-outline" size={24} color={COLORS.sky} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.sky} />
          <Text style={styles.loadingText}>Generating your feedback...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.rose} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : reviewData ? (
        <View style={styles.reviewWrapper}>
          {/* Log data before rendering ReviewCard */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={styles.viewShotContainer}>
            <ReviewCard data={reviewData} />
          </ViewShot>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.lightRose} />
          <Text style={styles.errorText}>No feedback data available</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.button} onPress={handleStartNewInterview}>
        <Text style={styles.buttonText}>Start New Interview</Text>
      </TouchableOpacity>
      
      {/* Share options modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showShareOptions}
        onRequestClose={() => setShowShareOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Interview Feedback</Text>
            
            <TouchableOpacity 
              style={styles.shareOption} 
              onPress={() => {
                shareInterviewReview(reviewData!);
                setShowShareOptions(false);
              }}
            >
              <Ionicons name="text-outline" size={24} color={COLORS.sky} />
              <Text style={styles.shareOptionText}>Share as Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption} 
              onPress={() => {
                captureAndShareScreenshot(viewShotRef as ViewShotRef);
                setShowShareOptions(false);
              }}
            >
              <Ionicons name="image-outline" size={24} color={COLORS.sky} />
              <Text style={styles.shareOptionText}>Share as Screenshot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.shareOption, styles.cancelOption]} 
              onPress={() => setShowShareOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    backButton: {
      padding: 8,
    },
    placeholder: {
      width: 40,
    },
    shareButton: {
      padding: 8,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.midnight,
      flex: 1,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: COLORS.nightSky,
    },
    reviewWrapper: {
      flex: 1,
      padding: 16,
      width: '100%',
    },
    viewShotContainer: {
      flex: 1,
      width: '100%',
      alignSelf: 'stretch',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      marginTop: 16,
      fontSize: 16,
      color: COLORS.rose,
      textAlign: 'center',
    },
    button: {
      backgroundColor: COLORS.sky,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      alignItems: 'center',
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for iOS home indicator
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.midnight,
      textAlign: 'center',
      marginBottom: 20,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    shareOptionText: {
      fontSize: 16,
      marginLeft: 15,
      color: COLORS.midnight,
    },
    cancelOption: {
      justifyContent: 'center',
      marginTop: 10,
      borderBottomWidth: 0,
    },
    cancelText: {
      fontSize: 16,
      color: COLORS.rose,
      textAlign: 'center',
      fontWeight: 'bold',
    },
});

export default InterviewReviewScreen;