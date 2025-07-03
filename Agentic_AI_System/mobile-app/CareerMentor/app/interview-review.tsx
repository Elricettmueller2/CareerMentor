import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Platform, SafeAreaView, ActivityIndicator, Share } from 'react-native';
import { Text as ThemedText } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { colors, typography, borderRadius, spacing } from '@/constants/DesignSystem';
import { InterviewSummaryData } from '@/types/interview';
import { formatInterviewReviewForSharing } from '@/utils/shareUtils';
import ReviewCard from '@/components/interview/ReviewCard';
import { Ionicons } from '@expo/vector-icons';
import { shareInterviewReview, captureAndShareScreenshot, ViewShotRef } from '@/utils/shareUtils';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { API_BASE_URL } from '@/constants/ApiEndpoints';
import { LinearGradient } from 'expo-linear-gradient';
import GradientButton from '@/components/trackpal/GradientButton';

const InterviewReviewScreen = () => {
  const { sessionId, interviewType } = useLocalSearchParams();
  const router = useRouter();
  const [reviewData, setReviewData] = useState<InterviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  const handleBackToInterviews = () => {
    router.replace('/(tabs)/interview');
  };
  
  const viewShotRef = useRef<ViewShot>(null);
  
  useEffect(() => {
    const checkViewShotInterval = setInterval(() => {
      console.log('[DEBUG] Periodic ViewShot check:', {
        refExists: !!viewShotRef,
        currentExists: viewShotRef ? !!viewShotRef.current : false,
        captureMethodExists: viewShotRef?.current ? typeof viewShotRef.current.capture === 'function' : false
      });
    }, 3000);
    
    return () => {
      clearInterval(checkViewShotInterval);
    };
  }, []);

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

        if (responseData.response) {
          if (typeof responseData.response === 'string') {
            try {
              let jsonString = responseData.response;
              if (!jsonString.trim().endsWith('}') && !jsonString.trim().endsWith(']')) {
                const scoresMatch = jsonString.match(/"scores"\s*:\s*\{[^\}]*\}/g);
                if (scoresMatch && scoresMatch[0]) {
                  try {
                    const minimalJson = `{${scoresMatch[0]}}`;
                    const parsedScores = JSON.parse(minimalJson);
                    responseData = { scores: parsedScores.scores };
                  } catch (scoreParseError) {
                    
                  }
                }
              } else {
                const parsedResponse = JSON.parse(jsonString);
                responseData = parsedResponse;
                
              }
            } catch (responseParseError) {
              
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
        
        if (responseData.data && typeof responseData.data === 'object') {
          responseData = responseData.data;
        }
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
            formattedData.recommendation = 'Consider';
          }
        } else {
          formattedData.recommendation = 'Consider';
        }

        console.log('[DEBUG] Final formatted data structure:', JSON.stringify({
          hasScores: Object.keys(formattedData.scores).length > 0,
          strengthsCount: formattedData.strengths.length,
          improvementAreasCount: formattedData.improvement_areas.length,
          hasFeedback: formattedData.specific_feedback.length > 0,
          hasRecommendation: formattedData.recommendation.length > 0,
        }));
        
        // On iOS, ensure we're not setting state during an unmounted component
        if (Platform.OS === 'ios') {
          setTimeout(() => {
            setReviewData(formattedData);
            setLoading(false);
          }, 100);
        } else {
          setReviewData(formattedData);
          setLoading(false);
        }
      } catch (e: any) {
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
          <Ionicons name="chevron-back" size={24} color={COLORS.nightSky} />
        </TouchableOpacity>
        <Text style={styles.title}>Interview Feedback</Text>
        {reviewData ? (
          <TouchableOpacity style={styles.shareButton} onPress={() => {
            setShowShareOptions(true);
          }}>
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
          {/* ViewShot component wrapper */}
          
          {/* ViewShot component */}
          <ViewShot 
            ref={viewShotRef} 
            options={{ format: 'png', quality: 0.9 }} 
            style={styles.viewShotContainer}
            onCapture={(uri) => console.log('[DEBUG] ViewShot captured:', uri ? 'URI exists' : 'URI is null')}
          >
            <ReviewCard data={reviewData} />
          </ViewShot>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.lightRose} />
          <Text style={styles.errorText}>No feedback data available</Text>
        </View>
      )}
      
      <GradientButton
        title="Start New Interview"
        onPress={() => router.push('/(tabs)/interview')}
        colors={[COLORS.rose, COLORS.sky]}
        style={{ margin: spacing.md }}
      />
      
      <View style={styles.returnButtonContainer}>
        <GradientButton
          title="Return to Interviews"
          onPress={handleBackToInterviews}
          colors={[COLORS.nightSky, COLORS.sky]}
          style={{ marginHorizontal: spacing.md, marginVertical: spacing.md }}
          icon={<Ionicons name="arrow-back" size={18} color={COLORS.white} />}
        />
      </View>

      {/* Share Options Bottom Sheet Modal - Implemented as a direct overlay for better reliability */}
      {showShareOptions && (
        <SafeAreaView style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1} 
            onPress={() => {
              console.log('[DEBUG] Modal backdrop pressed');
              setShowShareOptions(false);
            }}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Interview Feedback</Text>
            
            <TouchableOpacity 
              style={styles.shareOption} 
              activeOpacity={0.7}
              onPress={() => {
                try {
                  if (reviewData) {
                    const shareText = formatInterviewReviewForSharing(reviewData);
                    Share.share({
                      message: shareText,
                      title: 'My Interview Feedback',
                    }).then(result => {
                    }).catch(error => {
                      Alert.alert('Sharing Error', 'Failed to share text. Please try again.');
                    });
                    setShowShareOptions(false);
                  } else {
                    Alert.alert('Error', 'No interview data available to share');
                  }
                } catch (error) {
                  Alert.alert('Error', 'An unexpected error occurred while sharing');
                }
              }}
            >
              <Ionicons name="text-outline" size={24} color={COLORS.sky} />
              <Text style={styles.shareOptionText}>Share as Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption} 
              activeOpacity={0.7}
              onPress={() => {
                try {
                  if (viewShotRef && viewShotRef.current) {
                    
                    // Set a timeout to detect if the operation is taking too long
                    const timeoutId = setTimeout(() => {
                      Alert.alert(
                        'Operation Taking Too Long', 
                        'The screenshot capture is taking longer than expected. This might indicate a performance issue.'
                      );
                    }, 5000); // 5 second timeout
                    
                    const viewShotCurrent = viewShotRef.current;
                    if (!viewShotCurrent) {
                      clearTimeout(timeoutId);
                      console.error('[DEBUG] ViewShot ref current is null');
                      Alert.alert('Error', 'ViewShot reference is invalid');
                      return;
                    }
                    
                    viewShotCurrent.capture().then((uri: string) => {
                      clearTimeout(timeoutId);
                      
                      if (Platform.OS === 'android') {
                        const cacheDir = FileSystem.cacheDirectory;
                        if (cacheDir) {
                          const targetPath = `${cacheDir}interview_feedback_${Date.now()}.png`;
                          FileSystem.copyAsync({
                            from: uri,
                            to: targetPath
                          })
                          .then(() => {
                            Sharing.isAvailableAsync().then((isAvailable: boolean) => {
                              if (isAvailable) {
                                Sharing.shareAsync(targetPath).catch((error: Error) => {
                                  Alert.alert('Sharing Error', 'Failed to share screenshot on Android');
                                });
                              } else {
                                Alert.alert('Sharing Error', 'Sharing is not available on this device');
                              }
                            });
                          }).catch((error: Error) => {
                            Alert.alert('Error', 'Failed to prepare screenshot for sharing');
                          });
                        } else {
                          Alert.alert('Error', 'Cannot access cache directory');
                        }
                      } else {
                        Share.share({
                          url: uri,
                          title: 'My Interview Feedback',
                        }).catch(error => {
                          Alert.alert('Sharing Error', 'Failed to share screenshot on iOS');
                        });
                      }
                    }).catch((error: Error) => {
                      clearTimeout(timeoutId);
                      Alert.alert('Error', `Failed to capture screenshot: ${error.message || 'Unknown error'}`);
                    });
                    
                    setShowShareOptions(false);
                  } else {
                    Alert.alert('Error', 'Cannot capture screenshot. The view reference is invalid.');
                  }
                } catch (error) {
                  Alert.alert('Error', 'An unexpected error occurred while capturing screenshot');
                }
              }}
            >
              <Ionicons name="image-outline" size={24} color={COLORS.sky} />
              <Text style={styles.shareOptionText}>Share as Screenshot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.shareOption, styles.cancelOption]} 
              activeOpacity={0.7}
              onPress={() => {
                setShowShareOptions(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },

    returnButtonContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
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
      padding: spacing.sm,
    },
    placeholder: {
      width: 40,
    },
    shareButton: {
      padding: spacing.sm,
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
    // Modal styles
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      zIndex: 1000,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.neutral.white,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      padding: spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? spacing.xxxl : spacing.lg, // Extra padding for iOS home indicator
    },
    modalTitle: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.neutral.grey900,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral.grey200,
    },
    shareOptionText: {
      fontSize: typography.fontSize.md,
      marginLeft: spacing.md,
      color: colors.neutral.grey800,
    },
    cancelOption: {
      justifyContent: 'center',
      marginTop: spacing.sm,
      borderBottomWidth: 0,
    },
    cancelText: {
      fontSize: typography.fontSize.md,
      color: colors.accent.error,
      textAlign: 'center',
      fontFamily: typography.fontFamily.bold,
    },
});

export default InterviewReviewScreen;