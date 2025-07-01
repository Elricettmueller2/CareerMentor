import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import MessageBubble from './MessageBubble';

interface InterviewQuestionProps {
  question: string;
  answer?: string;
  feedback?: string;
  questionNumber: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const InterviewQuestion: React.FC<InterviewQuestionProps> = ({
  question,
  answer,
  feedback,
  questionNumber,
  expanded = false,
  onToggleExpand
}) => {
  const [animation] = useState(new Animated.Value(expanded ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: expanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [expanded, animation]);

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  return (
    <View style={[styles.container, expanded && styles.expandedContainer]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.questionNumberContainer}>
          <Text style={styles.questionNumber}>{questionNumber}</Text>
        </View>
        
        <Text style={styles.questionText} numberOfLines={expanded ? undefined : 2}>
          {question}
        </Text>
        
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={COLORS.midnight} 
          style={styles.chevron}
        />
      </TouchableOpacity>
      
      {expanded && (
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000]
              })
            }
          ]}
        >
          {answer && (
            <View style={styles.answerContainer}>
              <Text style={styles.sectionLabel}>Your Answer:</Text>
              <MessageBubble 
                message={answer} 
                isUser={true} 
              />
            </View>
          )}
          
          {feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.sectionLabel}>Feedback:</Text>
              <View style={styles.feedbackContent}>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  expandedContainer: {
    borderWidth: 1,
    borderColor: COLORS.nightSky,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  questionNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.nightSky,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.midnight,
    lineHeight: 22,
  },
  chevron: {
    marginLeft: 8,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: COLORS.salt,
  },
  answerContainer: {
    marginBottom: 16,
  },
  feedbackContainer: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 8,
  },
  feedbackContent: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sky,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.midnight,
  }
});

export default InterviewQuestion;
