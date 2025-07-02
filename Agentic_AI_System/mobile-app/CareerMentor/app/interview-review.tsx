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
import { API_BASE_URL } from '@/constants/ApiEndpoints';

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
        const response = await fetch(`${API_BASE_URL}/agents/mock_mate/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: { session_id: sessionId },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
        }

        // Get the raw response text first to inspect it
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        let responseData;
        try {
          // Try to parse the response text as JSON
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Error parsing response as JSON:', jsonError);
          // If the response isn't valid JSON, create a simple text-based review
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
            specific_feedback: responseText || 'No feedback available',
            recommendation: 'Consider'
          });
          setLoading(false);
          return;
        }
        
        // Now we have valid JSON in responseData
        try {
          let parsedData;
          
          // Handle different response formats
          if (responseData.response) {
            // Format 1: { response: ... }
            if (typeof responseData.response === 'string') {
              try {
                // Try to parse the response field as JSON
                parsedData = JSON.parse(responseData.response);
                console.log('Successfully parsed response field as JSON:', parsedData);
              } catch (jsonError) {
                console.log('Response field is not valid JSON, using as text:', responseData.response);
                // If it's not valid JSON, create a simple text-based review
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
                  specific_feedback: responseData.response || 'No feedback available',
                  recommendation: 'Consider'
                });
                setLoading(false);
                return;
              }
            } else if (typeof responseData.response === 'object') {
              // Response field is already an object
              parsedData = responseData.response;
              console.log('Response field is already an object:', parsedData);
            } else {
              throw new Error('Unexpected response format');
            }
          } else {
            // Format 2: Direct JSON object
            parsedData = responseData;
            console.log('Using direct response object:', parsedData);
          }
          
          // Check if this is our expected format with scores
          if (parsedData.scores || 
              (parsedData.strengths && parsedData.improvement_areas) || 
              parsedData.specific_feedback) {
            
            // Create a properly structured InterviewSummaryData object
            const formattedData: InterviewSummaryData = {
              scores: {
                technical_knowledge: parsedData.scores?.technical_knowledge || 0,
                problem_solving: parsedData.scores?.problem_solving || 0,
                communication: parsedData.scores?.communication || 0,
                cultural_fit: parsedData.scores?.cultural_fit || 0,
                overall: parsedData.scores?.overall || 0
              },
              strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
              improvement_areas: Array.isArray(parsedData.improvement_areas) ? parsedData.improvement_areas : [],
              specific_feedback: typeof parsedData.specific_feedback === 'string' ? parsedData.specific_feedback : '',
              recommendation: (parsedData.recommendation === 'Hire' || parsedData.recommendation === 'Consider' || parsedData.recommendation === 'Reject') 
                ? parsedData.recommendation 
                : 'Consider'
            };
            
            console.log('Formatted data:', formattedData);
            setReviewData(formattedData);
          } else {
            // Fallback for unexpected data structure
            console.log('Unexpected data structure, creating fallback review');
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
              specific_feedback: JSON.stringify(parsedData, null, 2) || 'Unexpected response format',
              recommendation: 'Consider'
            });
          }
        } catch (error) {
          const parseError = error instanceof Error ? error : new Error('Unknown error');
          console.error('Error processing review data:', parseError);
          // Create a simple error review
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
            specific_feedback: `Error processing data: ${parseError.message}\n\nRaw response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`,
            recommendation: 'Consider'
          });
        }
      } catch (e: any) {
        setError(`Failed to load review: ${e.message}`);
      } finally {
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
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.midnight} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {interviewType ? `${interviewType} Interview` : 'Interview'} Feedback
        </Text>
        {reviewData ? (
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => setShowShareOptions(true)}
          >
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
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
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