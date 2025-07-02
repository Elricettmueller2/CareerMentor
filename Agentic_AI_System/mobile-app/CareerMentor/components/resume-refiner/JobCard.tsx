import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS } from '@/constants/Colors';
import { truncateText, formatSkillsList } from '@/utils/formatters';
import { Job } from '@/utils/dataLoader';
import { Ionicons } from '@expo/vector-icons';

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
  isSelected?: boolean;
  showMatchScore?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onPress, 
  isSelected = false,
  showMatchScore = false 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={() => onPress(job)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.jobInfo}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.location}>{job.location}</Text>
          
          <View style={styles.skillsContainer}>
            <Text style={styles.skillsLabel}>Skills:</Text>
            <Text style={styles.skills}>{formatSkillsList(job.skills)}</Text>
          </View>
          
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {truncateText(job.description, 100)}
          </Text>
        </View>
        
        {showMatchScore && (
          <View style={styles.matchContainer}>
            <View style={styles.matchCircle}>
              <Text style={styles.matchPercentage}>{job.match}%</Text>
            </View>
            <Text style={styles.matchLabel}>Match</Text>
          </View>
        )}
        
        {!showMatchScore && isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={CAREER_COLORS.sky} />
          </View>
        )}
        
        {!showMatchScore && !isSelected && (
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color={CAREER_COLORS.nightSky} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Helper function to determine the color based on match percentage
const getMatchColor = (match: number): string => {
  if (match >= 90) return CAREER_COLORS.sky;
  if (match >= 75) return CAREER_COLORS.rose;
  if (match >= 60) return CAREER_COLORS.lightRose;
  return CAREER_COLORS.nightSky;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CAREER_COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: CAREER_COLORS.salt,
    borderWidth: 2,
    borderColor: CAREER_COLORS.nightSky,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CAREER_COLORS.nightSky,
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: CAREER_COLORS.sky,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: CAREER_COLORS.midnight,
    marginBottom: 8,
  },
  skillsContainer: {
    marginBottom: 8,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CAREER_COLORS.midnight,
  },
  skills: {
    fontSize: 14,
    color: CAREER_COLORS.nightSky,
  },
  description: {
    fontSize: 14,
    color: CAREER_COLORS.midnight,
    lineHeight: 20,
  },
  matchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CAREER_COLORS.salt,
    borderWidth: 3,
    borderColor: CAREER_COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CAREER_COLORS.nightSky,
  },
  matchLabel: {
    fontSize: 14,
    color: CAREER_COLORS.nightSky,
    marginTop: 4,
  },
  selectedIndicator: {
    padding: 8,
  },
  arrowContainer: {
    padding: 8,
  }
});

export default JobCard;
