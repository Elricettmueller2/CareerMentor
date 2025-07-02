import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StatsCard from './StatsCard';

interface StatsDashboardProps {
  stats: {
    totalApplications: number;
    jobsToApply: number;
    interviewsSecured: number;
    interviewRate: number;
    followUpOpportunities: number;
  };
  onJobsToApplyPress: () => void;
  onFollowUpPress: () => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  onJobsToApplyPress,
  onFollowUpPress,
}) => {
  return (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Stats</Text>
      <View style={styles.statsGrid}>
        {/* Total Applications */}
        <StatsCard 
          label="Total Applications" 
          value={stats.totalApplications} 
        />
        
        {/* Interviews Secured */}
        <StatsCard 
          label="Interviews Secured" 
          value={stats.interviewRate} 
          suffix="%" 
        />
        
        {/* Jobs to Apply */}
        <StatsCard 
          label="Jobs to Apply" 
          value={stats.jobsToApply}
          isClickable={stats.jobsToApply > 0}
          showArrow={stats.jobsToApply > 0}
          onPress={onJobsToApplyPress}
        />
        
        {/* Follow-Up Opportunities */}
        <StatsCard 
          label="Follow-Ups" 
          value={stats.followUpOpportunities}
          isClickable={stats.followUpOpportunities > 0}
          showArrow={stats.followUpOpportunities > 0}
          onPress={onFollowUpPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default StatsDashboard;
