import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert, 
  RefreshControl, 
  ScrollView,
  SafeAreaView,
  Keyboard,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApplicationForm from '../../components/ApplicationForm';
import ApplicationService, { JobApplication } from '../../services/ApplicationService';
import TrackPalService, { PatternInsight } from '../../services/TrackPalService';
import NotificationService from '../../services/NotificationService';
import NotificationTest from '../../components/NotificationTest';

// Import new modular components
import StatsCard from '../../components/trackpal/StatsCard';
import StatsDashboard from '../../components/trackpal/StatsDashboard';
import InsightCard from '../../components/trackpal/InsightCard';
import AIInsightsSection from '../../components/trackpal/AIInsightsSection';
import AddApplicationButton from '../../components/trackpal/AddApplicationButton';
import ChatButton from '../../components/trackpal/ChatButton';
import TabNavigation from '../../components/trackpal/TabNavigation';
import EmptyState from '../../components/trackpal/EmptyState';
import ApplicationsList from '../../components/trackpal/ApplicationsList';

export default function TrackPalScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  
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
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ai'>('dashboard');

  // Auto-loading of insights when the component mounts
  // (comment out if you don't want to load insights on initial load)
  useEffect(() => {
    loadPatternInsights();
  }, []);

  // Load applications when screen comes into focus
  // We'll use a ref to track if we've already loaded the AI data
  const aiDataLoaded = useRef(false);
  
  useFocusEffect(
    useCallback(() => {
      loadApplications();
      
      // No auto-loading of AI data when the tab is focused
    }, [activeTab])
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
      router.push(`/job-application-details?id=${randomApp.id}`);
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
      
      router.push(`/job-application-details?id=${appsWithReminders[0].id}`);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await ApplicationService.getApplications();
      setApplications(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadApplications(),
        activeTab === 'ai' ? loadReminders() : Promise.resolve(),
        activeTab === 'ai' ? loadPatternAnalysis() : Promise.resolve()
        // Don't automatically refresh insights on pull-to-refresh
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

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

  const askQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }
    
    try {
      setLoadingAnswer(true);
      const result = await TrackPalService.askQuestion(question);
      setAnswer(result);
    } catch (error) {
      console.error('Error asking question:', error);
      Alert.alert('Error', 'Failed to get an answer');
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleAddApplication = async (applicationData: any) => {
    try {
      // Add the application to storage
      const newApplication = await ApplicationService.addApplication({
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
      Alert.alert('Success', 'Application added successfully');
    } catch (error) {
      console.error('Error adding application:', error);
      Alert.alert('Error', 'Failed to add application');
    }
  };
  
  // Toggle chat modal
  const toggleChatModal = () => {
    setChatModalVisible(!chatModalVisible);
  };

  // Dashboard tab content
  const renderDashboardTab = () => (
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

      {/* Applications Section */}
      <Text style={styles.applicationSectionTitle}>Applications</Text>
      <ApplicationsList 
        applications={applications}
        loading={loading}
        refreshing={refreshing}
      />
    </ScrollView>
  );

  // Testing tab content
  const renderAIAssistantTab = () => (
    <ScrollView 
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#8089B4']}
          tintColor="#8089B4"
        />
      }
    >
      {/* Notification Test Section */}
      <NotificationTest />
      
      {/* Reminders Section */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <TouchableOpacity onPress={loadReminders} style={{padding: 5}}>
            {loadingReminders ? (
              <ActivityIndicator size="small" color="#8089B4" />
            ) : (
              <Ionicons name="refresh" size={20} color="#8089B4" />
            )}
          </TouchableOpacity>
        </View>
        
        {loadingReminders ? (
          <ActivityIndicator size="large" color="#8089B4" style={{marginVertical: 20}} />
        ) : reminders ? (
          <View style={styles.responseContainer}>
            <Text style={styles.aiResponse}>{reminders}</Text>
          </View>
        ) : (
          <EmptyState 
            icon="notifications-outline"
            title="No reminders at this time"
          />
        )}
      </View>
      
      {/* Pattern Analysis Section */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pattern Analysis</Text>
          <TouchableOpacity onPress={loadPatternAnalysis} style={{padding: 5}}>
            {loadingPatterns ? (
              <ActivityIndicator size="small" color="#8089B4" />
            ) : (
              <Ionicons name="refresh" size={20} color="#8089B4" />
            )}
          </TouchableOpacity>
        </View>
        
        {loadingPatterns ? (
          <ActivityIndicator size="large" color="#8089B4" style={{marginVertical: 20}} />
        ) : patterns ? (
          <View style={styles.responseContainer}>
            <Text style={styles.aiResponse}>{patterns}</Text>
          </View>
        ) : (
          <EmptyState 
            icon="analytics-outline"
            title="No pattern analysis available"
          />
        )}
      </View>
      
      {/* Ask TrackPal Section */}
      <View style={styles.askTrackPalSection}>
        <Text style={styles.askTrackPalTitle}>Ask TrackPal</Text>
        <Text style={styles.askTrackPalSubtitle}>Get personalized advice for your job search</Text>
        
        <TouchableOpacity style={styles.askButton} onPress={toggleChatModal}>
          <Text style={styles.askButtonText}>Ask a Question</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CareerMentor</Text>
      </View>

      <TabNavigation 
        activeTab={activeTab}
        onTabChange={(tab: 'dashboard' | 'ai') => setActiveTab(tab)}
      />
      
      {activeTab === 'dashboard' ? renderDashboardTab() : renderAIAssistantTab()}

      {/* Floating Action Buttons */}
      {activeTab === 'dashboard' && (
        <>
          {/* Chat Button */}
          <ChatButton onPress={toggleChatModal} />
          
          {/* Add Application Button */}
          <AddApplicationButton onPress={() => setModalVisible(true)} />
        </>
      )}

      {/* Add Application Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Application</Text>
            <View style={{ width: 24 }} />
          </View>
          <ApplicationForm 
            onSubmit={handleAddApplication}
            onCancel={() => setModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
      
      {/* Ask TrackPal Chat Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chatModalVisible}
        onRequestClose={toggleChatModal}
      >
        <View style={styles.chatModalContainer}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatModalHeader}>
              <Text style={styles.chatModalTitle}>Ask TrackPal</Text>
              <TouchableOpacity onPress={toggleChatModal}>
                <Ionicons name="close" size={24} color="#5D5B8D" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.chatModalSubtitle}>Ask any question about your job applications</Text>
            
            <ScrollView style={styles.chatBody} contentContainerStyle={{paddingBottom: 10}}>
              {loadingAnswer ? (
                <View style={styles.chatLoadingContainer}>
                  <ActivityIndicator size="large" color="#5D5B8D" style={{marginVertical: 20}} />
                  <Text style={styles.loadingText}>Generating answer...</Text>
                </View>
              ) : answer ? (
                <View style={styles.chatAnswerContainer}>
                  <Text style={styles.chatAnswerLabel}>TrackPal's Answer:</Text>
                  <Text style={styles.chatAnswerText} selectable={true}>{answer}</Text>
                </View>
              ) : (
                <View style={styles.emptyAnswerContainer}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#ccc" />
                  <Text style={styles.emptyAnswerText}>Your answer will appear here</Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="E.g., Which companies should I follow up with?"
                value={question}
                onChangeText={setQuestion}
                multiline
              />
              <TouchableOpacity 
                style={[styles.chatSendButton, !question.trim() && styles.chatSendButtonDisabled]} 
                onPress={() => {
                  // Clear any previous answer before asking a new question
                  setAnswer('');
                  // Ask the question
                  askQuestion();
                  // Dismiss keyboard
                  Keyboard.dismiss();
                }}
                disabled={loadingAnswer || !question.trim()}
              >
                {loadingAnswer ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  responseContainer: {
    backgroundColor: '#f9f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  chatModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  chatModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  
  chatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  chatModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5D5B8D',
  },
  
  chatModalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  
  chatBody: {
    flex: 1,
    maxHeight: 300,
  },
  
  chatLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  
  emptyAnswerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  
  emptyAnswerText: {
    color: '#999',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  
  chatAnswerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#5D5B8D',
  },
  
  chatAnswerLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#5D5B8D',
  },
  
  chatAnswerText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  
  chatInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  
  chatSendButton: {
    backgroundColor: '#5D5B8D',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  
  chatSendButtonDisabled: {
    backgroundColor: '#ccc',
  },

  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  applicationSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    color: '#333',
  },

  applicationSectionSubtitle: {
    fontSize: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    color: '#333',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // AI tab styles
  aiTabContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },

  questionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginRight: 8,
  },

  askButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  askButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  answerContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f4fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4a6da7',
  },

  answerLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#4a6da7',
  },

  // Existing styles
  addButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonWithText: {
    backgroundColor: '#000',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  placeholderFix: {
    width: 0,
    height: 0,
  },

  aiSection: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },

  aiResponse: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#5D5B8D',
    borderBottomWidth: 0,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },

  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  },

  result: {
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  
  askTrackPalSection: {
    backgroundColor: '#5D5B8D',
    margin: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  askTrackPalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  
  askTrackPalSubtitle: {
    fontSize: 14,
    color: '#e0e0ff',
    marginBottom: 16,
  },
});
