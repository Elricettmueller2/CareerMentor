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
        const requestBody = {
          data: { session_id: sessionId },
        };
        
        // Add a small delay on iOS to ensure network is ready
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const response = await fetch(`${API_BASE_URL}/agents/mock_mate/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
        }

        const responseText = await response.text();
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
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

        
        
        // Check if the response has a 'response' field that contains the review (from logs we see this is the case)
        if (responseData.response) {
          
          
          
          // Some APIs return the review as a JSON string that needs to be parsed again
          if (typeof responseData.response === 'string') {
            try {
              
              
              // Try to fix potentially incomplete JSON by ensuring it's properly terminated
              let jsonString = responseData.response;
              // Check if the string appears to be cut off
              if (!jsonString.trim().endsWith('}') && !jsonString.trim().endsWith(']')) {
                
                // Try to extract just the scores object which appears to be complete
                const scoresMatch = jsonString.match(/"scores"\s*:\s*\{[^\}]*\}/g);
                if (scoresMatch && scoresMatch[0]) {
                  
                  try {
                    // Create a minimal valid JSON with just the scores
                    const minimalJson = `{${scoresMatch[0]}}`;
                    const parsedScores = JSON.parse(minimalJson);
                    responseData = { scores: parsedScores.scores };
                    
                  } catch (scoreParseError) {
                    
                  }
                }
              } else {
                // Try normal parsing if the JSON appears complete
                const parsedResponse = JSON.parse(jsonString);
                responseData = parsedResponse;
                
              }
            } catch (responseParseError) {
              
              // Try to extract scores directly from the string using regex
              try {
                
                const technicalMatch = responseData.response.match(/"technical_knowledge"\s*:\s*(\d+)/i);
                const problemSolvingMatch = responseData.response.match(/"problem_solving"\s*:\s*(\d+)/i);
                const communicationMatch = responseData.response.match(/"communication"\s*:\s*(\d+)/i);
                const culturalFitMatch = responseData.response.match(/"cultural_fit"\s*:\s*(\d+)/i);
                const overallMatch = responseData.response.match(/"overall"\s*:\s*(\d+)/i);
                
                if (technicalMatch || problemSolvingMatch || communicationMatch || culturalFitMatch || overallMatch) {
                  
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
                  
                  responseData.specific_feedback = feedbackMatch[1];
                }
              } catch (regexError) {
                
              }
            }
          } else if (typeof responseData.response === 'object') {
            responseData = responseData.response;
          }
        }
        
        // Check if the response has a 'data' field that contains the review
        if (responseData.data && typeof responseData.data === 'object') {
          responseData = responseData.data;
        }

        // Check if the response has a 'review' field that contains the review
        if (responseData.review) {
          
          
          // Some APIs return the review as a JSON string that needs to be parsed again
          if (typeof responseData.review === 'string') {
            try {
              
              const parsedReview = JSON.parse(responseData.review);
              responseData = parsedReview;
              
            } catch (reviewParseError) {
              
            }
          } else if (typeof responseData.review === 'object') {
            responseData = responseData.review;
          }
        }

        // Extract scores
        if (responseData.scores && typeof responseData.scores === 'object') {
          
          
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
          
          formattedData.strengths = responseData.strengths;
        }

        // Extract improvement areas
        if (Array.isArray(responseData.improvement_areas)) {
          
          formattedData.improvement_areas = responseData.improvement_areas;
        }

        // Extract specific feedback - try multiple possible locations based on API response format
        let specificFeedback = null;
        
        // Try direct specific_feedback field
        if (typeof responseData.specific_feedback === 'string') {
          
          specificFeedback = responseData.specific_feedback;
        }
        // Try feedback field (alternative name)
        else if (typeof responseData.feedback === 'string') {
          
          specificFeedback = responseData.feedback;
        }
        // Try detailed_feedback field (another alternative name)
        else if (typeof responseData.detailed_feedback === 'string') {
          
          specificFeedback = responseData.detailed_feedback;
        }
        // Try comments field (another possible field name)
        else if (typeof responseData.comments === 'string') {
          
          specificFeedback = responseData.comments;
        }
        // If we have a feedback object with a text field
        else if (responseData.feedback && typeof responseData.feedback.text === 'string') {
          
          specificFeedback = responseData.feedback.text;
        }
        // If we have a feedback object with a content field
        else if (responseData.feedback && typeof responseData.feedback.content === 'string') {
          
          specificFeedback = responseData.feedback.content;
        }
        // Try to extract feedback from the raw response if we still don't have it
        else if (responseText && responseText.includes('specific_feedback')) {
          
          try {
            // Look for specific_feedback in the raw response
            const feedbackMatch = responseText.match(/"specific_feedback"\s*:\s*"([^"]*)"/i);
            if (feedbackMatch && feedbackMatch[1]) {
              
              specificFeedback = feedbackMatch[1];
            } else {
              // Try to find any paragraph that might be feedback
              const paragraphMatch = responseText.match(/"([^"]{30,})"/); // Look for longer quoted strings
              if (paragraphMatch && paragraphMatch[1]) {
                
                specificFeedback = paragraphMatch[1];
              }
            }
          } catch (regexError) {
            
          }
        }
        
        // Set the feedback in the formatted data
        if (specificFeedback && specificFeedback.length > 0) {
          formattedData.specific_feedback = specificFeedback;
        } else {
          formattedData.specific_feedback = 'No specific feedback provided for this interview.';
        }

        // Extract recommendation
        if (typeof responseData.recommendation === 'string') {
          
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
            
            formattedData.recommendation = 'Hire';
          } 
          else if (recommendationValue.toLowerCase().includes('reject') || 
                   recommendationValue.toLowerCase().includes('no') || 
                   recommendationValue.toLowerCase().includes('not suitable')) {
            
            formattedData.recommendation = 'Reject';
          } 
          else {
            
            formattedData.recommendation = 'Consider';
          }
        } 
        // Try to extract recommendation from raw response if not found
        else if (responseText) {
          
          const rawText = responseText.toLowerCase();
          if (rawText.includes('"recommendation"') || rawText.includes('recommendation:')) {
            if ((rawText.includes('hire') && !rawText.includes('not hire')) || 
                rawText.includes('strong candidate')) {
              
              formattedData.recommendation = 'Hire';
            } else if (rawText.includes('reject') || 
                      rawText.includes('not suitable') || 
                      rawText.includes('not recommend')) {
              
              formattedData.recommendation = 'Reject';
            } else {
              
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