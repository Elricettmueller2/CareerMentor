import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from './MessageBubble';
import { InterviewEvaluation } from '@/types/interview';

interface EnhancedMessageBubbleProps {
  message: string | InterviewEvaluation;
  isUser: boolean;
  timestamp?: string;
}

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isUser,
  timestamp
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // If it's a user message or plain text, use regular MessageBubble
  if (isUser || typeof message === 'string') {
    return (
      <MessageBubble 
        message={typeof message === 'string' ? message : JSON.stringify(message)}
        isUser={isUser}
        timestamp={timestamp}
      />
    );
  }
  
  // For structured agent responses
  const { evaluation, follow_up, notes } = message;
  
  return (
    <View style={styles.container}>
      {/* Main evaluation message */}
      {evaluation && (
        <View style={styles.evaluationContainer}>
          <Text style={styles.evaluationText}>{evaluation}</Text>
        </View>
      )}
      
      {/* Toggle button for additional details */}
      {notes && (
        <TouchableOpacity 
          style={styles.detailsToggle}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Text>
          <Ionicons 
            name={showDetails ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={COLORS.sky}
          />
        </TouchableOpacity>
      )}
      
      {/* Additional details when expanded */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          {notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Interviewer Notes:</Text>
              <Text style={styles.detailText}>{notes}</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Timestamp */}
      {timestamp && (
        <Text style={styles.timestamp}>{timestamp}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  evaluationContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.sky,
    shadowColor: COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  evaluationText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.midnight,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsToggleText: {
    fontSize: 12,
    color: COLORS.sky,
    fontWeight: '600',
    marginRight: 4,
  },
  detailsContainer: {
    backgroundColor: COLORS.salt,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    shadowColor: COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  detailSection: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.midnight,
  },
  timestamp: {
    fontSize: 10,
    color: '#A0A0A0', // Using a direct hex color since lightGray isn't in COLORS
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 8,
  }
});

export default EnhancedMessageBubble;
