import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { InterviewSummaryData } from '@/types/interview';

interface ReviewCardProps {
  data: InterviewSummaryData;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ data }) => {
  // Ensure data has all required properties with fallbacks
  const safeData = {
    scores: {
      technical_knowledge: data.scores?.technical_knowledge || 0,
      problem_solving: data.scores?.problem_solving || 0,
      communication: data.scores?.communication || 0,
      cultural_fit: data.scores?.cultural_fit || 0,
      overall: data.scores?.overall || 0
    },
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    improvement_areas: Array.isArray(data.improvement_areas) ? data.improvement_areas : [],
    specific_feedback: typeof data.specific_feedback === 'string' ? data.specific_feedback : '',
    recommendation: data.recommendation || 'Consider'
  };
  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return COLORS.sky; // High score - sky
    if (score >= 70) return COLORS.nightSky; // Medium score - nightSky
    if (score >= 50) return COLORS.lightRose; // Low score - lightRose
    return COLORS.rose; // Very low score - rose
  };

  // Helper function to get recommendation color
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Hire': return COLORS.sky; // Positive - sky
      case 'Consider': return COLORS.nightSky; // Neutral - nightSky
      case 'Reject': return COLORS.rose; // Negative - rose
      default: return COLORS.sky;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Recommendation Banner */}
      <View style={[
        styles.recommendationBanner, 
        { backgroundColor: getRecommendationColor(safeData.recommendation) }
      ]}>
        <Text style={styles.recommendationText}>{safeData.recommendation}</Text>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreOverviewContainer}>
        <View style={styles.overallScoreContainer}>
          <Text style={styles.overallScoreValue}>{safeData.scores.overall}</Text>
          <Text style={styles.overallScoreLabel}>Overall Score</Text>
        </View>
      </View>

      {/* Detailed Scores */}
      <View style={styles.detailedScoresContainer}>
        <Text style={styles.sectionTitle}>Performance Breakdown</Text>
        
        {/* Technical Knowledge */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Technical Knowledge</Text>
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { 
                  width: `${safeData.scores.technical_knowledge}%`,
                  backgroundColor: getScoreColor(safeData.scores.technical_knowledge)
                }
              ]} 
            />
          </View>
          <Text style={styles.scoreValue}>{safeData.scores.technical_knowledge}</Text>
        </View>
        
        {/* Problem Solving */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Problem Solving</Text>
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { 
                  width: `${safeData.scores.problem_solving}%`,
                  backgroundColor: getScoreColor(safeData.scores.problem_solving)
                }
              ]} 
            />
          </View>
          <Text style={styles.scoreValue}>{safeData.scores.problem_solving}</Text>
        </View>
        
        {/* Communication */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Communication</Text>
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { 
                  width: `${safeData.scores.communication}%`,
                  backgroundColor: getScoreColor(safeData.scores.communication)
                }
              ]} 
            />
          </View>
          <Text style={styles.scoreValue}>{safeData.scores.communication}</Text>
        </View>
        
        {/* Cultural Fit */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Cultural Fit</Text>
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { 
                  width: `${safeData.scores.cultural_fit}%`,
                  backgroundColor: getScoreColor(safeData.scores.cultural_fit)
                }
              ]} 
            />
          </View>
          <Text style={styles.scoreValue}>{safeData.scores.cultural_fit}</Text>
        </View>
      </View>

      {/* Strengths */}
      <View style={styles.feedbackSection}>
        <Text style={styles.sectionTitle}>Strengths</Text>
        {safeData.strengths.length > 0 ? (
          safeData.strengths.map((strength, index) => (
            <View key={`strength-${index}`} style={styles.bulletPoint}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{strength}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No strengths data available</Text>
        )}
      </View>

      {/* Areas for Improvement */}
      <View style={styles.feedbackSection}>
        <Text style={styles.sectionTitle}>Areas for Improvement</Text>
        {safeData.improvement_areas.length > 0 ? (
          safeData.improvement_areas.map((area, index) => (
            <View key={`improvement-${index}`} style={styles.bulletPoint}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{area}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No improvement areas data available</Text>
        )}
      </View>

      {/* Specific Feedback */}
      <View style={styles.feedbackSection}>
        <Text style={styles.sectionTitle}>Detailed Feedback</Text>
        <Text style={styles.feedbackText}>{safeData.specific_feedback || 'No detailed feedback available'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  recommendationBanner: {
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scoreOverviewContainer: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overallScoreContainer: {
    alignItems: 'center',
  },
  overallScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.midnight,
  },
  overallScoreLabel: {
    fontSize: 14,
    color: COLORS.nightSky,
    marginTop: 5,
  },
  detailedScoresContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.midnight,
    marginBottom: 15,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    flex: 2,
    fontSize: 14,
    color: COLORS.nightSky,
  },
  scoreBarContainer: {
    flex: 5,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.midnight,
    textAlign: 'right',
    marginLeft: 8,
  },
  feedbackSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 16,
    color: COLORS.sky,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.nightSky,
    lineHeight: 20,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.nightSky,
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.nightSky,
    fontStyle: 'italic',
  },
});

export default ReviewCard;
