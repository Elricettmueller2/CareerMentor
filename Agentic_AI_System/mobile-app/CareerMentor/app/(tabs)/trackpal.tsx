import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Button, 
  Alert, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApplicationForm from '../../components/ApplicationForm';
import ApplicationService, { JobApplication } from '../../services/ApplicationService';
import TrackPalService from '../../services/TrackPalService';

export default function TrackPalScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // TrackPal AI states
  const [reminders, setReminders] = useState<string>('');
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [patterns, setPatterns] = useState<string>('');
  const [loadingPatterns, setLoadingPatterns] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'ai'>('applications');

  // Load applications when screen comes into focus
  // We'll use a ref to track if we've already loaded the AI data
  const aiDataLoaded = useRef(false);
  
  useFocusEffect(
    useCallback(() => {
      loadApplications();
      
      // Only load AI data on first render or when explicitly refreshed
      if (activeTab === 'ai' && !aiDataLoaded.current) {
        loadReminders();
        loadPatternAnalysis();
        aiDataLoaded.current = true;
      }
    }, [activeTab])
  );

  const loadApplications = async () => {
    try {
      setLoading(true);
      const apps = await ApplicationService.getApplications();
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
    if (activeTab === 'ai') {
      loadReminders();
      loadPatternAnalysis();
      // Reset the flag when manually refreshing
      aiDataLoaded.current = true;
    }
  };
  
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
      await ApplicationService.addApplication({
        ...applicationData,
        applicationDeadline: applicationData.applicationDeadline ? 
          applicationData.applicationDeadline.toISOString() : null,
        followUpDate: applicationData.followUpDate ? 
          applicationData.followUpDate.toISOString() : null,
      });
      setModalVisible(false);
      loadApplications();
      Alert.alert('Success', 'Application added successfully');
    } catch (error) {
      console.error('Error adding application:', error);
      Alert.alert('Error', 'Failed to add application');
    }
  };

  // checkReminders function removed as it's no longer needed

  const renderApplicationItem = ({ item }: { item: JobApplication }) => {
    return (
      <TouchableOpacity style={styles.applicationItem}>
        <View style={styles.applicationHeader}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status}</Text>
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
        style={[styles.tab, activeTab === 'applications' && styles.activeTab]}
        onPress={() => setActiveTab('applications')}
      >
        <Ionicons 
          name="list-outline" 
          size={20} 
          color={activeTab === 'applications' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'applications' && styles.activeTabText]}>Applications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
        onPress={() => {
          setActiveTab('ai');
          // Don't automatically load AI data when switching tabs
          // Only load if we haven't loaded it before
          if (!aiDataLoaded.current) {
            loadReminders();
            loadPatternAnalysis();
            aiDataLoaded.current = true;
          }
        }}
      >
        <Ionicons 
          name="bulb-outline" 
          size={20} 
          color={activeTab === 'ai' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>AI Assistant</Text>
      </TouchableOpacity>
    </View>
  );

  // Applications tab content
  const renderApplicationsTab = () => (
    <>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    </>
  );

  // AI Assistant tab content
  const renderAITab = () => (
    <ScrollView 
      style={styles.aiTabContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Test API Connectivity */}
      <View style={styles.aiSection}>
        <Text style={styles.sectionTitle}>API Connection Test</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10}}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={async () => {
              try {
                Alert.alert('Testing API', 'Sending test request to check_reminders endpoint...');
                const result = await TrackPalService.getReminders();
                Alert.alert('API Test Result', `Success! Response: ${result.substring(0, 100)}...`);
              } catch (error) {
                Alert.alert('API Test Failed', `Error: ${error}`);
              }
            }}
          >
            <Text style={styles.testButtonText}>Test Reminders API</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={async () => {
              try {
                Alert.alert('Testing API', 'Sending test request to direct_test endpoint...');
                const result = await TrackPalService.askQuestion('Hello, how are you?');
                Alert.alert('API Test Result', `Success! Response: ${result.substring(0, 100)}...`);
              } catch (error) {
                Alert.alert('API Test Failed', `Error: ${error}`);
              }
            }}
          >
            <Text style={styles.testButtonText}>Test Direct API</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminders Section */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reminders & Follow-ups</Text>
          <TouchableOpacity onPress={loadReminders} disabled={loadingReminders}>
            <Ionicons name="refresh" size={20} color="#4a6da7" />
          </TouchableOpacity>
        </View>
        
        {loadingReminders ? (
          <ActivityIndicator size="small" color="#4a6da7" style={{marginVertical: 20}} />
        ) : (
          <Text style={styles.aiResponse}>{reminders || 'No reminders available.'}</Text>
        )}
      </View>

      {/* Pattern Analysis Section */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Application Insights</Text>
          <TouchableOpacity onPress={loadPatternAnalysis} disabled={loadingPatterns}>
            <Ionicons name="refresh" size={20} color="#4a6da7" />
          </TouchableOpacity>
        </View>
        
        {loadingPatterns ? (
          <ActivityIndicator size="small" color="#4a6da7" style={{marginVertical: 20}} />
        ) : (
          <Text style={styles.aiResponse}>{patterns || 'No pattern analysis available.'}</Text>
        )}
      </View>

      {/* Direct Questions Section */}
      <View style={styles.aiSection}>
        <Text style={styles.sectionTitle}>Ask TrackPal</Text>
        <Text style={styles.sectionSubtitle}>Ask any question about your job applications</Text>
        
        <View style={styles.questionContainer}>
          <TextInput
            style={styles.questionInput}
            placeholder="E.g., Which companies should I follow up with?"
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <TouchableOpacity 
            style={styles.askButton} 
            onPress={askQuestion}
            disabled={loadingAnswer || !question.trim()}
          >
            <Text style={styles.askButtonText}>Ask</Text>
          </TouchableOpacity>
        </View>
        
        {loadingAnswer ? (
          <ActivityIndicator size="small" color="#4a6da7" style={{marginVertical: 20}} />
        ) : answer ? (
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>TrackPal's Answer:</Text>
            <Text style={styles.aiResponse}>{answer}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TrackPal</Text>
        {activeTab === 'applications' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {renderTabs()}
      
      {activeTab === 'applications' ? renderApplicationsTab() : renderAITab()}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Application to Track</Text>
            <View style={{ width: 24 }} />
          </View>
          <ApplicationForm 
            onSubmit={handleAddApplication}
            onCancel={() => setModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  testButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  statusBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  companyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
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
    color: '#888',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6da7',
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
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
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
});
