import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import CircularProgress from '@/components/resume-refiner/CircularProgress';

interface SkillScore {
  name: string;
  score: number;
}

interface InterviewSummaryProps {
  overallScore: number;
  skillScores: SkillScore[];
  strengths: string[];
  improvementAreas: string[];
  generalFeedback: string;
  interviewType: 'Technical' | 'Behavioral';
}

const InterviewSummary: React.FC<InterviewSummaryProps> = ({
  overallScore,
  skillScores,
  strengths,
  improvementAreas,
  generalFeedback,
  interviewType
}) => {
  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return COLORS.sky;
    if (score >= 70) return COLORS.rose;
    if (score >= 50) return COLORS.lightRose;
    return COLORS.nightSky;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Interview Performance</Text>
        <View style={[
          styles.badge,
          interviewType === 'Technical' ? styles.technicalBadge : styles.behavioralBadge
        ]}>
          <Text style={styles.badgeText}>{interviewType}</Text>
        </View>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreContainer}>
        <CircularProgress 
          percentage={overallScore} 
          size={120} 
          strokeWidth={12}
          progressColor={getScoreColor(overallScore)}
          textSize={24}
        />
        <Text style={styles.scoreLabel}>Overall Performance</Text>
      </View>

      {/* Skill Scores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Assessment</Text>
        {skillScores.map((skill, index) => (
          <View key={index} style={styles.skillRow}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <View style={styles.scoreBarContainer}>
              <View 
                style={[
                  styles.scoreBar, 
                  { width: `${skill.score}%`, backgroundColor: getScoreColor(skill.score) }
                ]} 
              />
            </View>
            <Text style={styles.skillScore}>{skill.score}%</Text>
          </View>
        ))}
      </View>

      {/* Strengths */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strengths</Text>
        {strengths.map((strength, index) => (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>{strength}</Text>
          </View>
        ))}
      </View>

      {/* Areas for Improvement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Areas for Improvement</Text>
        {improvementAreas.map((area, index) => (
          <View key={index} style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>{area}</Text>
          </View>
        ))}
      </View>

      {/* General Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Feedback</Text>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{generalFeedback}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.midnight,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicalBadge: {
    backgroundColor: COLORS.sky,
  },
  behavioralBadge: {
    backgroundColor: COLORS.rose,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.midnight,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.nightSky,
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillName: {
    width: '30%',
    fontSize: 14,
    color: COLORS.midnight,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  skillScore: {
    width: '10%',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.midnight,
    textAlign: 'right',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: COLORS.sky,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.midnight,
    lineHeight: 20,
  },
  feedbackContainer: {
    backgroundColor: COLORS.salt,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.nightSky,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.midnight,
  }
});

export default InterviewSummary;
