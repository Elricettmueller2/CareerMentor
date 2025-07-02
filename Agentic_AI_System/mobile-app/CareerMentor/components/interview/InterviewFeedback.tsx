import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, borderRadius, spacing } from '@/constants/DesignSystem';

interface ScoreItem {
  name: string;
  score: number;
}

interface FeedbackProps {
  scores: {
    technical_knowledge?: number;
    problem_solving?: number;
    communication?: number;
    cultural_fit?: number;
    overall: number;
    [key: string]: number | undefined;
  };
  strengths: string[];
  improvement_areas: string[];
  specific_feedback?: string;
  recommendation?: string;
}

export const InterviewFeedback: React.FC<FeedbackProps> = ({
  scores,
  strengths,
  improvement_areas,
  specific_feedback,
  recommendation,
}) => {
  // Convert scores object to array for rendering
  const scoreItems: ScoreItem[] = Object.entries(scores)
    .filter(([key, value]) => value !== undefined)
    .map(([key, value]) => ({
      name: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      score: value as number
    }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Scores</Text>
        {scoreItems.map((item, index) => (
          <View key={index} style={styles.scoreItem}>
            <Text style={styles.scoreName}>{item.name}</Text>
            <View style={styles.scoreBarContainer}>
              <View 
                style={[
                  styles.scoreBar, 
                  { 
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score)
                  }
                ]} 
              />
            </View>
            <Text style={styles.scoreValue}>{item.score}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strengths</Text>
        {strengths.map((strength, index) => (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>{strength}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Areas for Improvement</Text>
        {improvement_areas.map((area, index) => (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>{area}</Text>
          </View>
        ))}
      </View>

      {specific_feedback && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specific Feedback</Text>
          <Text style={styles.paragraphText}>{specific_feedback}</Text>
        </View>
      )}

      {recommendation && (
        <View style={[styles.section, styles.recommendationSection]}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

// Helper function to determine color based on score
const getScoreColor = (score: number): string => {
  if (score >= 85) return colors.accent.success;
  if (score >= 70) return colors.secondary.main;
  if (score >= 50) return colors.accent.warning;
  return colors.accent.error;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral.grey800,
    marginBottom: spacing.md,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreName: {
    width: '30%',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral.grey700,
  },
  scoreBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.neutral.grey200,
    borderRadius: borderRadius.round,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
  scoreValue: {
    width: '15%',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutral.grey800,
    textAlign: 'right',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    fontSize: typography.fontSize.lg,
    color: colors.primary.main,
    marginRight: spacing.xs,
    lineHeight: typography.fontSize.md * 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral.grey700,
    lineHeight: typography.fontSize.md * 1.5,
  },
  paragraphText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral.grey700,
    lineHeight: typography.fontSize.md * 1.5,
  },
  recommendationSection: {
    marginBottom: 0,
  },
  recommendationContainer: {
    backgroundColor: colors.primary.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  recommendationText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral.white,
    textAlign: 'center',
  },
});

export default InterviewFeedback;
