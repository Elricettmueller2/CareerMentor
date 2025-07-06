import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface InterviewProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  estimatedTimeRemaining?: number;
}

const InterviewProgress: React.FC<InterviewProgressProps> = ({
  currentQuestion,
  totalQuestions,
  estimatedTimeRemaining
}) => {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Question {currentQuestion} of {totalQuestions}
        </Text>
        {estimatedTimeRemaining !== undefined && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={COLORS.midnight} />
            <Text style={styles.timeText}>
              ~{estimatedTimeRemaining} min remaining
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.midnight,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.midnight,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.nightSky,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.sky,
    borderRadius: 3,
  }
});

export default InterviewProgress;
