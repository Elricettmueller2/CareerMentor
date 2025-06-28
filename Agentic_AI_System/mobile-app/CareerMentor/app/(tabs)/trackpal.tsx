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
    replyRate: 0,
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

  // No auto-loading of insights when the component mounts
  // useEffect(() => {
  //   loadPatternInsights();
  // }, []);

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
        replyRate: 0,
        interviewRate: 0,
        followUpOpportunities: 0
      });
      return;
    }
    
    const total = apps.length;
    
    // Count applications with responses (interview, accepted, or rejected)
    const withResponse = apps.filter(app => 
      app.status === 'interview' || 
      app.status === 'accepted' || 
      app.status === 'rejected'
    ).length;
  
    // Count applications with interviews or accepted
    const withInterview = apps.filter(app => 
      app.status === 'interview' || 
      app.status === 'accepted'
    ).length;
  
    // Count applications that need follow-up
    const needFollowUp = apps.filter(app => 
      (app.status === 'applied' && 
       new Date().getTime() - new Date(app.appliedDate).getTime() > 7 * 24 * 60 * 60 * 1000) || // 7 days since application
      (app.status === 'interview' && 
       new Date().getTime() - new Date(app.followUpDate || app.appliedDate).getTime() > 3 * 24 * 60 * 60 * 1000) // 3 days since interview
    ).length;
    
    setStats({
      totalApplications: total,
      replyRate: total > 0 ? Math.round((withResponse / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((withInterview / total) * 100) : 0,
      followUpOpportunities: needFollowUp
    });
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

  // checkReminders function removed as it's no longer needed

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
        onPress={() => router.push(`/job-application-details?id=${item.id}`)}
      >
        <View style={styles.applicationHeader}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{formatStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.companyText}>{item.company}</Text>
        {item.location && <Text style={styles.locationText}>{item.location}</Text>}
        
        <View style={styles.applicationFooter}>
          <Text style={styles.dateText}>
            {item.applicationDeadline ? 
              `Deadline: ${new Date(item.applicationDeadline).toLocaleDateString()}` : 
              `Added: ${new Date(item.appliedDate).toLocaleDateString()}`}
          </Text>
          
          {item.followUpDate && (
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={14} color="#fff" />
              <Text style={styles.reminderText}>
                {new Date(item.followUpDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Tab navigation component
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => setActiveTab('dashboard')}
      >
        <Ionicons 
          name="list-outline" 
          size={20} 
          color={activeTab === 'dashboard' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
        onPress={() => {
          setActiveTab('ai');
          // No auto-loading of AI data when switching tabs
        }}
      >
        <Ionicons 
          name="bulb-outline" 
          size={20} 
          color={activeTab === 'ai' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>Testing</Text>
      </TouchableOpacity>
    </View>
  );

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
      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          {/* Total Applications */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Applications</Text>
            <Text style={styles.statValue}>{stats.totalApplications}</Text>
          </View>
          
          {/* Reply Rate */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Reply Rate</Text>
            <Text style={styles.statValue}>{stats.replyRate}%</Text>
          </View>
          
          {/* Interview Rate */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Interview Rate</Text>
            <Text style={styles.statValue}>{stats.interviewRate}%</Text>
          </View>
          
          {/* Follow-Up Opportunities */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Follow-Up Opportunities</Text>
            <Text style={styles.statValue}>{stats.followUpOpportunities}</Text>
          </View>
        </View>
      </View>
      
      {/* AI Insights Section */}
      <View style={styles.aiInsightsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.insightsSectionTitle}>AI Insights</Text>
          <TouchableOpacity onPress={loadPatternInsights} disabled={loadingInsights}>
            <Ionicons name="refresh" size={20} color="#4a6da7" />
          </TouchableOpacity>
        </View>
        
        {loadingInsights ? (
          <ActivityIndicator size="small" color="#4a6da7" style={{marginVertical: 20}} />
        ) : (
          <View style={styles.insightsContainer}>
            {patternInsights.map((insight) => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightIconCircle}>
                  <Ionicons name={insight.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.insightText}>{insight.content}</Text>
              </View>
            ))}
            
            {patternInsights.length === 0 && (
              <Text style={styles.noInsightsText}>No insights available. Add more applications to get personalized insights.</Text>
            )}
          </View>
        )}
      </View>

      {/* Applications Section */}
      <Text style={styles.applicationSectionTitle}>Your Applications</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : applications.length > 0 ? (
        <FlatList
          data={applications}
          renderItem={renderApplicationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Applications Yet</Text>
          <Text style={styles.emptySubText}>
            Add your first job application to start tracking
          </Text>
        </View>
      )}
      
      {/* Ask TrackPal Section removed - now available via floating chat button */}
    </ScrollView>
  );

  // Testing tab content
  const renderAIAssistantTab = () => (
    <ScrollView 
      style={styles.container}
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
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No reminders at this time</Text>
          </View>
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
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No pattern analysis available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TrackPal</Text>
      </View>

      {renderTabs()}
      
      {activeTab === 'dashboard' ? renderDashboardTab() : renderAIAssistantTab()}

      {/* Floating Action Buttons */}
      {activeTab === 'dashboard' && (
        <>
          {/* Chat Button */}
          <TouchableOpacity
            style={styles.chatFab}
            onPress={toggleChatModal}
          >
            <LinearGradient
              colors={['#5D5B8D', '#4a6da7']}
              style={styles.chatFabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Add Application Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={['#C29BB8', '#8089B4']}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.fabText}>Add Application</Text>
              <Ionicons name="add" size={30} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
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
  // Response container for AI content
  responseContainer: {
    backgroundColor: '#f9f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  // Chat floating button styles
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 85, // Position above the add button
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 30,
    zIndex: 999,
  },
  
  chatFabGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // Chat modal styles
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
  // Stats section styles
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
  statCard: {
    backgroundColor: '#5D5B8D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 50,
    zIndex: 999,
  },
  
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
  },
  
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  // AI Insights styles
  aiInsightsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  insightsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  insightsContainer: {
    marginBottom: 16,
  },
  insightsList: {
    paddingBottom: 8,
  },
  noInsightsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 15,
  },

  insightCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#5D5B8D',
  },

  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#fff',
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

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },

  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },

  activeTabText: {
    color: '#000',
    fontWeight: '600',
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContainer: {
    padding: 16,
  },

  applicationItem: {
    backgroundColor: '#5D5B8D',
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
    color: '#fff',
  },

  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    color: '#fff',
  },

  companyText: {
    fontSize: 16,
    color: '#fff',
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
    color: '#fff',
    marginLeft: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  
  // Fix for duplicate property
  // This is a placeholder to avoid duplicate property error
  placeholderFix: {
    width: 0,
    height: 0,
  },

  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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
    color: '#6c757d',
    marginBottom: 16,
  },
  

});
