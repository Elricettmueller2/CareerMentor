import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL = 'http://localhost:8000';

const InterviewReviewScreen = () => {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [review, setReview] = useState('');
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

        const data = await response.json();
        setReview(data.response);
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
    <View style={styles.container}>
      <Text style={styles.title}>Interview Feedback</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2f95dc" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>{review}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={handleStartNewInterview}>
        <Text style={styles.buttonText}>Start New Interview</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      },
      reviewContainer: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 30,
        width: '100%',
        borderWidth: 1,
        borderColor: '#eee',
      },
      reviewText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
      },
      errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
      },
      button: {
        backgroundColor: '#2f95dc',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
      },
      buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
});

export default InterviewReviewScreen;