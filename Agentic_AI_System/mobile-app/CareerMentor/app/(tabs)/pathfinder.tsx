import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, Platform, Keyboard } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { DEFAULT_API_BASE_URL, API_ENDPOINTS, getApiUrl, getAllApiUrls } from '../../config/api';

// Typendefinition für die Slider-Props
type CustomSliderProps = {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  style?: any;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
};

// Web-kompatible Slider-Komponente
const CustomSlider = (props: CustomSliderProps) => {
  // Verwende Platform.OS um zu prüfen, ob wir auf Web sind
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        value={props.value}
        min={props.minimumValue || 0}
        max={props.maximumValue || 100}
        step={props.step || 1}
        onChange={(e) => props.onValueChange && props.onValueChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 40,
          accentColor: '#2f95dc',
          cursor: 'pointer',
          ...props.style
        }}
      />
    );
  } else {
    // Für native Plattformen importiere den nativen Slider dynamisch
    // Dies verhindert Probleme beim Web-Build
    const NativeSlider = require('@react-native-community/slider').default;
    return <NativeSlider {...props} />;
  }
};

export default function PathFinderScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'saved'
  
  const [jobTitle, setJobTitle] = useState('');
  const [degree, setDegree] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [locationRadius, setLocationRadius] = useState(50); // Default 50km
  const [interests, setInterests] = useState('');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);
  const [savedJobs, setSavedJobs] = useState<Array<any>>([]);
  const [recommendations, setRecommendations] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // API-URLs werden jetzt zentral in config/api.ts verwaltet
  const userId = 'default_user';

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const url = getApiUrl(`${API_ENDPOINTS.pathFinder.savedJobs}/${userId}`);
      console.log('Fetching saved jobs from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setSavedJobs(data.saved_jobs || []);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setSavedJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const url = getApiUrl(API_ENDPOINTS.pathFinder.recommendJobs);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { user_id: userId } }),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
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
    
    // Request location permission when component mounts
    requestLocationPermission();
  }, [activeTab]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        return true;
      } else {
        Alert.alert(
          "Standortberechtigung erforderlich",
          "Für die Entfernungssuche wird Ihre Standortberechtigung benötigt."
        );
        return false;
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  };

  const handleSearch = async () => {
    if (!jobTitle) {
      setError('Bitte geben Sie einen Job-Titel ein.');
      return;
    }
    
    if (!degree) {
      setError('Bitte geben Sie Ihren höchsten Abschluss ein.');
      return;
    }
    
    if (!interests) {
      setError('Bitte geben Sie Interessenpunkte ein.');
      return;
    }
    
    // Request location permission if not already granted
    if (!locationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        setError('Standortberechtigung wird für die Entfernungssuche benötigt.');
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    Keyboard.dismiss();
    
    const searchCriteria = {
      user_id: userId,
      job_title: jobTitle.trim(),
      education_level: degree.trim(),
      years_experience: yearsExperience,
      location_radius: locationRadius,
      interest_points: interests.trim().split(',').map(item => item.trim()),
      location: userLocation ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      } : undefined
    };

    try {
      console.log('Searching for jobs with criteria:', searchCriteria);
      
      // Verwende die getAllApiUrls-Funktion, um alle möglichen API-URLs zu erhalten
      const apiUrls = getAllApiUrls(API_ENDPOINTS.pathFinder.search);
      
      let lastError = null;
      let successfulUrl = null;
      
      // Versuche nacheinander alle URLs
      for (const url of apiUrls) {
        try {
          console.log(`Versuche API-URL: ${url}`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: searchCriteria }),
          });
          
          console.log(`URL ${url} gab Status ${response.status} zurück`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fehler mit URL ${url}:`, errorText);
            continue; // Versuche die nächste URL
          }
          
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          try {
            const data = JSON.parse(responseText);
            console.log('Parsed search results:', data);
            
            // Überprüfe verschiedene mögliche Antwortformate
            if (data && data.top_jobs && Array.isArray(data.top_jobs)) {
              console.log('Ergebnisse gefunden in data.top_jobs');
              setResults(data.top_jobs);
              successfulUrl = url;
              break;
            } else if (data && Array.isArray(data)) {
              console.log('Ergebnisse gefunden als Array');
              setResults(data);
              successfulUrl = url;
              break;
            } else if (data && data.jobs && Array.isArray(data.jobs)) {
              console.log('Ergebnisse gefunden in data.jobs');
              setResults(data.jobs);
              successfulUrl = url;
              break;
            } else {
              console.warn('Unerwartetes Antwortformat:', data);
              // Versuche die nächste URL
            }
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            // Versuche die nächste URL
          }
        } catch (error: any) {
          console.error(`Fehler mit URL ${url}:`, error);
          lastError = error;
          // Versuche die nächste URL
        }
      }
      
      if (successfulUrl) {
        console.log(`Suche erfolgreich mit URL: ${successfulUrl}`);
      } else {
        // Wenn wir hier ankommen, haben alle URLs fehlgeschlagen
        throw new Error(lastError ? lastError.message : 'Keine Verbindung zum Server möglich');
      }
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
        ? getApiUrl(API_ENDPOINTS.pathFinder.unsaveJob)
        : getApiUrl(API_ENDPOINTS.pathFinder.saveJob);
      
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

  const navigateToAdvancedSearch = () => {
    router.push('/job-search');
  };

  const renderSearchContent = () => (
    <ScrollView 
      style={styles.searchScrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.detailedSearchContainer}>
        <Text style={styles.inputLabel}>Jobtitel</Text>
        <TextInput
          style={styles.textInput}
          placeholder="z.B. Software Developer"
          value={jobTitle}
          onChangeText={setJobTitle}
        />
        
        <Text style={styles.inputLabel}>Bildungsabschluss</Text>
        <TextInput
          style={styles.textInput}
          placeholder="z.B. Bachelor"
          value={degree}
          onChangeText={setDegree}
        />
        
        <Text style={styles.inputLabel}>Berufserfahrung (Jahre)</Text>
        <View style={styles.sliderContainer}>
          <CustomSlider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={yearsExperience}
            onValueChange={setYearsExperience}
            minimumTrackTintColor="#2f95dc"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#2f95dc"
          />
          <Text style={styles.sliderValue}>{yearsExperience}</Text>
        </View>
        
        <Text style={styles.inputLabel}>Suchradius (km)</Text>
        <View style={styles.sliderContainer}>
          <CustomSlider
            style={styles.slider}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={locationRadius}
            onValueChange={setLocationRadius}
            minimumTrackTintColor="#2f95dc"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#2f95dc"
          />
          <Text style={styles.sliderValue}>{locationRadius}</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Text style={styles.locationStatus}>
            {locationPermission 
              ? userLocation 
                ? 'Standort verfügbar' 
                : 'Standort wird ermittelt...'
              : 'Standort nicht verfügbar'
            }
          </Text>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.locationButtonText}>
              {locationPermission ? 'Aktualisieren' : 'Erlauben'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.inputLabel}>Interessen (durch Komma getrennt)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="z.B. Python, JavaScript, React"
          value={interests}
          onChangeText={setInterests}
          multiline
        />
        <Text style={styles.inputHint}>
          Gib deine Fähigkeiten und Interessen an, um passendere Ergebnisse zu erhalten.
        </Text>
        
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!jobTitle || jobTitle.trim().length < 2) && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={!jobTitle || jobTitle.trim().length < 2}
        >
          <Text style={styles.searchButtonText}>Suchen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.advancedSearchButton}
          onPress={navigateToAdvancedSearch}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.advancedSearchButtonText}>Erweiterte Suche</Text>
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

      {!loading && (!results || results.length === 0) && !error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            Führen Sie eine Suche durch, um Ergebnisse zu sehen.
          </Text>
        </View>
      )}

      {Array.isArray(results) && results.map((job, idx) => (
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
    backgroundColor: '#f5f5f5',
  },
  sliderContainer: {
    marginBottom: 15,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderValue: {
    width: 60,
    textAlign: 'right',
    fontSize: 14,
    color: '#555',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  locationStatus: {
    fontSize: 14,
    color: '#555',
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
    marginBottom: 15,
  },
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
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
  advancedSearchButton: {
    marginTop: 16,
    backgroundColor: '#5A5D80',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  advancedSearchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
