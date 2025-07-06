import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { JobApplication } from '../../services/JobService';
import EmptyState from './EmptyState';
import { CAREER_COLORS } from '../../constants/Colors';

interface ApplicationsListProps {
  applications: JobApplication[];
  loading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const ApplicationsList = ({ 
  applications, 
  loading, 
  refreshing = false,
  onRefresh 
}: ApplicationsListProps) => {
  const router = useRouter();
  
  // Format status text for display
  const formatStatusText = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'saved': return 'Saved';
      case 'applied': return 'Applied';
      case 'interview': return 'Interview';
      case 'rejected': return 'Rejected';
      case 'accepted': return 'Accepted';
      default: return 'Saved';
    }
  };

  const renderApplicationItem = ({ item }: { item: JobApplication }) => {
    return (
      <TouchableOpacity 
        style={styles.applicationItem}
        onPress={() => router.push(`/trackpal-job-details?id=${item.id}`)}
      >
        <View style={styles.applicationHeader}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{formatStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.companyText}>{item.company}</Text>
        <Text style={styles.locationText}>{item.location || 'Location not specified'}</Text>
        
        <View style={styles.applicationFooter}>
          <Text style={styles.dateText}>
            {item.applicationDeadline ? 
              `Deadline: ${new Date(item.applicationDeadline).toLocaleDateString()}` : 
              `Added: ${new Date(item.appliedDate).toLocaleDateString()}`}
          </Text>
          
          {item.followUpDate && (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={14} color={CAREER_COLORS.white} />
              <Text style={styles.reminderText}>
                {new Date(item.followUpDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={CAREER_COLORS.sky} />
      </View>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState 
        icon="document-text-outline"
        title="No Saved Jobs Yet"
        subtitle="Add your first job to start tracking"
      />
    );
  }

  return (
    <FlatList
      data={applications}
      renderItem={renderApplicationItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      scrollEnabled={false}
      nestedScrollEnabled={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  listContainer: {
    padding: 16,
  },

  applicationItem: {
    backgroundColor: CAREER_COLORS.nightSky,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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

  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  reminderText: {
    fontSize: 12,
    color: CAREER_COLORS.white,
    marginLeft: 4,
  },
});

export default ApplicationsList;
