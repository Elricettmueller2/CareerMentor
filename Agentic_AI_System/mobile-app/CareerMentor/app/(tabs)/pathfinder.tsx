import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Keyboard, View, FlatList, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

export default function PathFinderScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'
  
  const [jobTitle, setJobTitle] = useState('');
  const [degree, setDegree] = useState('');
  const [hardSkills, setHardSkills] = useState(5); 
  const [softSkills, setSoftSkills] = useState(5); 
  const [interests, setInterests] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);
  const [savedJobs, setSavedJobs] = useState<Array<any>>([]);
  const [recommendations, setRecommendations] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE_URL = 'http://192.168.178.29:8000';
  const userId = 'default_user';

  const fetchSavedJobs = async () => {
    try {
      console.log('Fetching saved jobs from:', `${API_BASE_URL}/agents/path_finder/saved_jobs/${userId}`);
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/saved_jobs/${userId}`);
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Saved jobs data:', data);
      setSavedJobs(data.saved_jobs || []);
    } catch (err: any) {
      console.error('Error fetching saved jobs:', err);
      setError('Failed to load saved jobs');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { user_id: userId, limit: 3 } }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
    }
  };
  
  const loadSavedJobsData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchSavedJobs(), fetchRecommendations()]);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'search') {
      if (jobTitle || degree || interests) {
        handleSearch();
      } else {
        setRefreshing(false);
      }
    } else {
      loadSavedJobsData();
    }
  };

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedJobsData();
    }
  }, [activeTab]);

  const handleSearch = async () => {
    if (!jobTitle && !degree && !interests) {
      setError('Bitte füllen Sie mindestens eines der Textfelder für die Suche aus.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    Keyboard.dismiss();
    
    const searchCriteria = {
      user_id: userId,
      job_title: jobTitle.trim(),
      degree: degree.trim(),
      hard_skills_rating: hardSkills,
      soft_skills_rating: softSkills,
      interests: interests.trim(),
    };

    try {
      console.log('Searching for jobs with criteria:', searchCriteria);
      console.log('API endpoint:', `${API_BASE_URL}/agents/path_finder/search_jobs_online`);
      
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/search_jobs_online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: searchCriteria }), 
      });
      
      if (!response.ok) {
        console.error('Error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      setResults(data.jobs || []);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(`Fehler beim Laden der Jobs: ${err.message}. Stellen Sie sicher, dass das Backend läuft und die API-Route die neuen Kriterien verarbeiten kann.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigateToJobDetails = (jobId: string) => {
    router.push(`/job-details?jobId=${jobId}`);
  };

  const toggleSaveJob = async (job: any) => {
    try {
      const endpoint = job.is_saved 
        ? `${API_BASE_URL}/agents/path_finder/unsave_job`
        : `${API_BASE_URL}/agents/path_finder/save_job`;
      
      const payload = job.is_saved
        ? { data: { user_id: userId, job_id: job.id } }
        : { data: { user_id: userId, job_data: { ...job, id: job.id || undefined } } }; 
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      if (activeTab === 'search') {
        setResults(results.map(item => 
          item.id === job.id ? { ...item, is_saved: !item.is_saved } : item
        ));
      } else {
        if (job.is_saved) {
          setSavedJobs(savedJobs.filter(item => item.id !== job.id));
        } else {
          if (!savedJobs.find(sj => sj.id === job.id)) {
            setSavedJobs([job, ...savedJobs]);
          }
        }
      }
      if (activeTab === 'saved') loadSavedJobsData();

    } catch (err) {
      console.error('Error saving/unsaving job:', err);
    }
  };

  const renderJobCard = (job: any) => (
    <View style={styles.resultCard}>
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={() => toggleSaveJob(job)}
      >
        <Ionicons 
          name={job.is_saved ? "bookmark" : "bookmark-outline"} 
          size={24} 
          color={job.is_saved ? "#2f95dc" : "#888"} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.jobCardContent}
        onPress={() => navigateToJobDetails(job.id)}
      >
        <Text style={styles.resultTitle}>{job.title || 'Job Title'}</Text>
        <Text style={styles.resultCompany}>
          {job.company || ''}
          {job.location ? ` | ${job.location}` : ''}
        </Text>
        
        {job.description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {job.description}
          </Text>
        )}
        
        {job.skills && (
          <Text style={styles.resultSkills} numberOfLines={1}>
            {typeof job.skills === 'string' ? job.skills : job.skills.join(', ')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSearchContent = () => (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.searchScrollView}>
      <View style={styles.detailedSearchContainer}>
        <Text style={styles.inputLabel}>Job Titel</Text>
        <TextInput
          style={styles.textInput}
          placeholder="z.B. Softwareentwickler, Projektmanager"
          value={jobTitle}
          onChangeText={setJobTitle}
        />

        <Text style={styles.inputLabel}>Höchster erreichter Abschluss</Text>
        <TextInput
          style={styles.textInput}
          placeholder="z.B. Bachelor, Master, Ausbildung"
          value={degree}
          onChangeText={setDegree}
        />

        <Text style={styles.inputLabel}>Hard Skills (Einschätzung {hardSkills}/10)</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={hardSkills}
          onValueChange={setHardSkills}
          minimumTrackTintColor="#2f95dc"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#2f95dc"
        />

        <Text style={styles.inputLabel}>Soft Skills (Einschätzung {softSkills}/10)</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={softSkills}
          onValueChange={setSoftSkills}
          minimumTrackTintColor="#2f95dc"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#2f95dc"
        />

        <Text style={styles.inputLabel}>Generelle Interessen</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="z.B. KI, Nachhaltigkeit, Webentwicklung"
          value={interests}
          onChangeText={setInterests}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>Suchen</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Job Ergebnisse</Text>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
          <Text style={styles.loadingText}>Jobs werden gesucht...</Text>
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && results.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            Führen Sie eine Suche durch, um Ergebnisse zu sehen.
          </Text>
        </View>
      )}

      {results.map((job, idx) => (
        <View key={job.id || idx}>
          {renderJobCard(job)}
        </View>
      ))}
    </ScrollView>
  );

  const renderSavedJobsContent = () => (
    <>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
          <Text style={styles.loadingText}>Loading saved jobs...</Text>
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView 
        style={styles.savedJobsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Saved Jobs</Text>
        
        {!loading && savedJobs.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              You haven't saved any jobs yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Jobs you save will appear here.
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => setActiveTab('search')}
            >
              <Text style={styles.browseButtonText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        )}

        {savedJobs.map((job, idx) => (
          <View key={job.id || idx}>
            {renderJobCard({...job, is_saved: true})}
          </View>
        ))}

        {recommendations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, {marginTop: 24}]}>Recommended Jobs</Text>
            {recommendations.map((job, idx) => (
              <View key={job.id || idx}>
                {renderJobCard(job)}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Path Finder</Text>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'search' ? styles.activeTab : null]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'search' ? styles.activeTabText : null]}>Suche</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'saved' ? styles.activeTab : null]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'saved' ? styles.activeTabText : null]}>Gespeichert</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' ? renderSearchContent() : renderSavedJobsContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16, 
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2, 
  },
  activeTab: {
    backgroundColor: '#2f95dc',
  },
  tabButtonText: {
    fontSize: 15, 
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  searchScrollView: {
    flex: 1,
  },
  detailedSearchContainer: {
    marginBottom: 20,
    paddingHorizontal: 8, 
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12, 
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10, 
  },
  textArea: {
    height: 80, 
    textAlignVertical: 'top', 
  },
  slider: {
    width: '100%',
    height: 40, 
    marginBottom: 10, 
  },
  searchButton: {
    marginTop: 20, 
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16, 
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#ff3b30',
    marginVertical: 16,
    textAlign: 'center',
    paddingHorizontal: 10, 
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#2f95dc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  resultsContainer: { 
    flex: 1,
  },
  savedJobsContainer: {
    flex: 1,
  },
  resultCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  saveButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  jobCardContent: {
    flex: 1,
    padding: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  resultCompany: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  resultSkills: {
    fontSize: 14,
    color: '#2f95dc',
  },
});
