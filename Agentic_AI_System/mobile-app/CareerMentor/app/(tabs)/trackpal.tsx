import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  Modal, 
  Alert, 
  RefreshControl, 
  ScrollView
} from 'react-native';
import { CAREER_COLORS } from '../../constants/Colors';
import { useFocusEffect } from '@react-navigation/native';
import ApplicationForm from '../../components/ApplicationForm';
import JobService, { JobApplication } from '../../services/JobService';
import TrackPalService, { PatternInsight } from '../../services/TrackPalService';
import NotificationService from '../../services/NotificationService';

// Import modular components
import StatsDashboard from '../../components/trackpal/StatsDashboard';
import AIInsightsSection from '../../components/trackpal/AIInsightsSection';
import AddJobButton from '../../components/trackpal/AddApplicationButton';
import EmptyState from '../../components/trackpal/EmptyState';
import ApplicationsList from '../../components/trackpal/ApplicationsList';

// Import common components
import CareerDaddyHeader from '../../components/common/CareerDaddyHeader';

// Define styles at the top to avoid usage before declaration
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: CAREER_COLORS.nightSky,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 16,
  },
  applicationSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  }
});

export default function TrackPalScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  
  // Application stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    jobsToApply: 0,
    interviewsSecured: 0,
    interviewRate: 0,
    followUpOpportunities: 0
  });
  
  // TrackPal AI states
  const [reminders, setReminders] = useState<string>('');
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [patterns, setPatterns] = useState<string>('');
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Auto-loading of insights when the component mounts
  // (comment out if you don't want to load insights on initial load)
  useEffect(() => {
    loadPatternInsights();
  }, []);

  // Load applications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [])
  );

  // Calculate application statistics
  const calculateStats = (apps: JobApplication[]) => {
    if (!apps || apps.length === 0) {
      setStats({
        totalApplications: 0,
        jobsToApply: 0,
        interviewsSecured: 0,
        interviewRate: 0,
        followUpOpportunities: 0
      });
      return;
    }
    
    const total = apps.length;
    
    // Count applications that are saved but not applied yet
    const savedJobs = apps.filter(app => app.status === 'saved').length;
    
    // Count applications that have secured interviews (including later stages)
    const withInterview = apps.filter(app => 
      app.status === 'interview' || 
      app.status === 'accepted' || 
      app.status === 'rejected'
    ).length;
    
    // Calculate interview success rate as a percentage
    const interviewRate = total > 0 ? Math.round((withInterview / total) * 100) : 0;
    
    // Count applications that need follow-up (based on followUpDate)
    const withReminders = apps.filter(app => app.followUpDate).length;
    
    setStats({
      totalApplications: total,
      jobsToApply: savedJobs,
      interviewsSecured: withInterview,
      interviewRate: interviewRate,
      followUpOpportunities: withReminders
    });
  };
  
  // Handle navigation to a random saved job
  const navigateToRandomSavedJob = () => {
    if (stats.jobsToApply === 0 || !applications) return;
    
    const savedApplications = applications.filter(app => app.status === 'saved');
    if (savedApplications.length > 0) {
      const randomIndex = Math.floor(Math.random() * savedApplications.length);
      const randomApp = savedApplications[randomIndex];
      router.push(`/trackpal-job-details?id=${randomApp.id}`);
    }
  };

  // Handle navigation to the most recent job needing follow-up
  const navigateToFollowUpJob = () => {
    if (stats.followUpOpportunities === 0 || !applications) return;
    
    // Get applications with follow-up dates set
    const appsWithReminders = applications.filter(app => app.followUpDate);
    
    if (appsWithReminders.length > 0) {
      // Sort by most recent first
      appsWithReminders.sort((a, b) => {
        const dateA = new Date(a.followUpDate || a.applicationDeadline || a.appliedDate);
        const dateB = new Date(b.followUpDate || b.applicationDeadline || b.appliedDate);
        return dateB.getTime() - dateA.getTime();
      });
      
      router.push(`/trackpal-job-details?id=${appsWithReminders[0].id}`);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await JobService.getJobs();
      setApplications(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      Alert.alert('Error', 'Failed to load saved jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadApplications();
      // Don't automatically refresh insights on pull-to-refresh
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // TrackPal AI methods
  const loadReminders = async () => {
    try {
      setLoadingReminders(true);
      const result = await TrackPalService.getReminders();
      setReminders(result);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoadingReminders(false);
    }
  };

  const loadPatternAnalysis = async () => {
    try {
      setLoadingPatterns(true);
      const result = await TrackPalService.getPatternAnalysis();
      setPatterns(result);
    } catch (error) {
      console.error('Error loading pattern analysis:', error);
      Alert.alert('Error', 'Failed to load pattern analysis');
    } finally {
      setLoadingPatterns(false);
    }
  };

  const loadPatternInsights = async () => {
    try {
      setLoadingInsights(true);
      const insights = await TrackPalService.getPatternInsights();
      setPatternInsights(insights);
    } catch (error) {
      console.error('Error loading pattern insights:', error);
      // Don't show alert for this as it's not critical for UX
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAddJob = async (applicationData: any) => {
    try {
      // Add the application to storage
      const newApplication = await JobService.addJob({
        ...applicationData,
        applicationDeadline: applicationData.applicationDeadline ? 
          applicationData.applicationDeadline.toISOString() : null,
        followUpDate: applicationData.followUpDate ? 
          applicationData.followUpDate.toISOString() : null,
      });
      
      // Schedule notification for follow-up reminder if a follow-up date is set
      if (applicationData.followUpDate) {
        try {
          // Request notification permissions if not already granted
          await NotificationService.requestPermissions();
          
          // Schedule the notification for the follow-up date
          const notificationId = await NotificationService.scheduleFollowUpReminder(
            newApplication.id,
            applicationData.company,
            applicationData.jobTitle,
            applicationData.followUpDate
          );
          
          if (notificationId) {
            console.log(`Scheduled follow-up reminder notification: ${notificationId}`);
          }
        } catch (notificationError) {
          console.error('Error scheduling notification:', notificationError);
          // Don't alert the user about notification errors, just log them
        }
      }
      
      setModalVisible(false);
      loadApplications();
      Alert.alert('Success', 'Job added successfully');
    } catch (error) {
      console.error('Error adding job:', error);
      Alert.alert('Error', 'Failed to add job');
    }
  };
  


  // Render the dashboard tab content
  const renderDashboardTab = () => {
    // If loading, show loading indicator
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CAREER_COLORS.nightSky} />
          <Text style={styles.loadingText}>Loading your applications...</Text>
        </View>
      );
    }

    // If no applications, show empty state
    if (applications.length === 0) {
      return (
        <EmptyState 
          title="You don't have any jobs saved yet!"
          subtitle="Find and track your first job application with PathFinder or add your own by clicking the + button."
          buttonText="Find Jobs"
          onButtonPress={() => router.push('/(tabs)/pathfinder')}
        />
      );
    }

    return (
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Stats Dashboard */}
      <StatsDashboard 
        stats={stats}
        onJobsToApplyPress={navigateToRandomSavedJob}
        onFollowUpPress={navigateToFollowUpJob}
      />
      
      {/* AI Insights Section */}
      <AIInsightsSection 
        insights={patternInsights}
        loading={loadingInsights}
        onRefresh={loadPatternInsights}
      />

      {/* Saved Jobs Section */}
      <Text style={styles.applicationSectionTitle}>My Saved Jobs</Text>
      <ApplicationsList 
        applications={applications}
        loading={loading}
        refreshing={refreshing}
      />
    </ScrollView>
  );
};

  return (
    <View style={styles.container}>
      {/* Header */}
      <CareerDaddyHeader title="CareerDaddy" />
      
      <View style={styles.contentContainer}>
        {renderDashboardTab()}
        
        {/* Add Job Button - Fixed position at bottom right */}
        <AddJobButton onPress={() => router.push('/trackpal-add-application')} />

        {/* Application Form Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <ApplicationForm 
            onCancel={() => setModalVisible(false)}
            onSubmit={handleAddJob}
          />
        </Modal>
      </View>
    </View>
  );
}

// Styles moved to the top of the file
