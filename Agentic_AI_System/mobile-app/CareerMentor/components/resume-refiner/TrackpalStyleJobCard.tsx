import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';
import { Job } from '@/utils/dataLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CircularProgress from '@/components/resume-refiner/CircularProgress';

interface TrackpalStyleJobCardProps {
  job: Job;
  onPress: (job: Job) => void;
  isSelected?: boolean;
  showMatchScore?: boolean;
}

const TrackpalStyleJobCard: React.FC<TrackpalStyleJobCardProps> = ({
  job,
  onPress,
  isSelected = false,
  showMatchScore = false
}) => {
  const router = useRouter();
  
  const handleViewDetails = () => {
    router.push(`/trackpal-job-details?id=${job.id}`);
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.applicationItem,
        isSelected && styles.selectedItem
      ]}
      onPress={() => onPress(job)}
      activeOpacity={0.7}
    >
      <View style={styles.applicationHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
      </View>
      <Text style={styles.companyText}>{job.company}</Text>
      <Text style={styles.locationText}>{job.location || 'Location not specified'}</Text>
      
      <View style={styles.applicationFooter}>
        {job.skills && job.skills.length > 0 && (
          <Text style={styles.dateText}>
            Skills: {job.skills.slice(0, 3).join(', ')}
            {job.skills.length > 3 ? '...' : ''}
          </Text>
        )}
      </View>
      
      {/* Match score badge */}
      {showMatchScore && job.match && (
        <View style={styles.matchScoreBadge}>
          <CircularProgress 
            percentage={job.match} 
            size={48} 
            strokeWidth={4} 
            textSize={14}
            textColor={CAREER_COLORS.white}
            progressColor={job.match > 70 ? CAREER_COLORS.green : job.match > 40 ? CAREER_COLORS.yellow : CAREER_COLORS.red}
            backgroundColor={CAREER_COLORS.salt}
          />
        </View>
      )}
      
      {/* View button with gradient in top right corner */}
      <TouchableOpacity 
        style={styles.viewButtonContainer}
        onPress={handleViewDetails}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
          style={styles.viewButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >          
        <Text style={styles.viewButtonText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  applicationItem: {
    backgroundColor: CAREER_COLORS.nightSky,
    borderColor: CAREER_COLORS.nightSky,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  
  selectedItem: {
    borderWidth: 2,
    borderColor: CAREER_COLORS.rose,
    backgroundColor: CAREER_COLORS.nightSky,
  },

  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: CAREER_COLORS.white,
  },

  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    color: CAREER_COLORS.white,
  },

  companyText: {
    fontSize: 16,
    color: CAREER_COLORS.white,
    marginBottom: 4,
  },

  locationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },

  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  dateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  viewButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    zIndex: 10,
  },
  
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  matchScoreBadge: {
    position: 'absolute',
    right: 16,
    top: 32,
    transform: [{ translateY: -20 }],
  },
  
  matchScoreText: {
    color: CAREER_COLORS.midnight,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default TrackpalStyleJobCard;
