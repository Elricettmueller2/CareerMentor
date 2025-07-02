import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { InterviewSummaryData } from '@/types/interview';
import ReviewCard from '@/components/interview/ReviewCard';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://localhost:8000';

const InterviewReviewScreen = () => {
  const { sessionId, interviewType } = useLocalSearchParams();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<InterviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    router.replace('/(tabs)/interview');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.midnight} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {interviewType ? `${interviewType} Interview` : 'Interview'} Feedback
        </Text>
        <View style={styles.placeholder} />
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
          <ReviewCard data={reviewData} />
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
});

export default InterviewReviewScreen;