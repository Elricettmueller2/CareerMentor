import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius, spacing } from '@/constants/DesignSystem';

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isUser,
  timestamp 
}) => {
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.agentContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.agentBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.agentText
        ]}>
          {message}
        </Text>
      </View>
      
      {timestamp && (
        <Text style={[
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.agentTimestamp
        ]}>
          {timestamp}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  agentContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary.main,
    borderBottomRightRadius: borderRadius.xs,
  },
  agentBubble: {
    backgroundColor: colors.neutral.white,
    borderBottomLeftRadius: borderRadius.xs,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.5,
  },
  userText: {
    color: colors.neutral.white,
    fontFamily: typography.fontFamily.regular,
  },
  agentText: {
    color: colors.neutral.grey800,
    fontFamily: typography.fontFamily.regular,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  userTimestamp: {
    color: colors.neutral.grey600,
  },
  agentTimestamp: {
    color: colors.neutral.grey500,
  },
});

export default MessageBubble;
