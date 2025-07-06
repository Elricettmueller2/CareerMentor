import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Platform, Alert, Keyboard } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { DEFAULT_API_BASE_URL, API_ENDPOINTS, getApiUrl, getAllApiUrls, fetchWithFallback } from '../../config/api';
import HeaderWithToggle from '../../components/common/HeaderWithToggle';
import { CAREER_COLORS } from '../../constants/Colors';
import GradientButton from '../../components/trackpal/GradientButton';

// Type definition for Slider props
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

// Web-compatible Slider component
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
          accentColor: '#5A5D80',
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40, 
  },
  sliderValue: {
    width: 30,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '500',
    color: '#5A5D80',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  locationStatus: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  locationButton: {
    backgroundColor: '#5A5D80',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: -8,
    marginBottom: 15,
  },
  searchButton: {
    backgroundColor: '#5A5D80',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  searchScrollView: {
    flex: 1,
  },
  detailedSearchContainer: {
    marginBottom: 20,
    paddingHorizontal: 16, 
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5A5D80',
    marginBottom: 8,
    marginTop: 16, 
  },
  requiredStar: {
    color: '#F14156',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10, 
  },
  textArea: {
    height: 80, 
    textAlignVertical: 'top', 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 30,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16, 
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
    backgroundColor: '#5A5D80',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  savedJobsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  resultCard: {
    backgroundColor: '#5A5D80',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  saveButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  jobCardContent: {
    flex: 1,
    paddingRight: 30,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  resultCompany: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultSkills: {
    fontSize: 13,
    color: '#d0d0d0',
    fontStyle: 'italic',
  },
  tabSwitcherContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    display: 'flex',
  },
});

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
  
  // Using a temporary userId for testing/demo purposes
  // In a real app, this would come from authentication
  const userId = '12345';
  
  // Function to navigate to job details
  const navigateToJobDetails = (jobId: string) => {
    // Navigate to job details page when implemented
    router.push(`/job-details?id=${jobId}`);
  };
  
  // Function to request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (err) {
      console.error('Error getting location permission:', err);
      Alert.alert('Location Access', 'Unable to access your location. Some features may be limited.');
    }
  };

  // Tabs for the HeaderWithToggle
  const toggleOptions = [
    { id: 'search', label: 'Search' },
    { id: 'saved', label: 'Saved' }
  ];
  
  // Reload data when activeTab changes to 'saved'
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedJobsData();
    }
  }, [activeTab]);
  
  // Function to fetch recommended jobs
  const fetchRecommendations = async () => {
    try {
      const response = await fetchWithFallback(
        getApiUrl(API_ENDPOINTS.pathFinder.recommendJobs),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { user_id: userId } }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError('Could not load job recommendations. Please check your network connection.');
    }
  };
  
  // Function to fetch saved jobs
  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const response = await fetchWithFallback(
        getApiUrl(`${API_ENDPOINTS.pathFinder.savedJobs}/${userId}`)
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setSavedJobs(data.saved_jobs || []);
    } catch (err: any) {
      console.error('Error fetching saved jobs:', err);
      setSavedJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

const handleSearch = async () => {
  if (!jobTitle || jobTitle.trim().length < 2) {
    setError('Bitte geben Sie einen Jobtitel ein (mindestens 2 Zeichen).');
    return;
  }

  Keyboard.dismiss();
  setLoading(true);
  setError(null);
  setResults([]);

  try {
    // Prepare data for the API request
    const interestsList = interests
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // Simplify job title for better results (as in test_path_finder.py)
    const simplifiedJobTitle = jobTitle.includes(' ') ? 
      jobTitle.split(' ')[0] : // Nimm nur das erste Wort, wenn es Leerzeichen gibt
      jobTitle;

    const requestData = {
      job_title: simplifiedJobTitle, // Simplified job title for better results
      education_level: degree || "Bachelor", // Standardwert, falls leer
      years_experience: yearsExperience || 3, // Standardwert von 3 wie im Test-Script
      location_radius: locationRadius,
      interest_points: interestsList.length > 0 ? interestsList : ["Python", "JavaScript"], // Standardwerte, falls leer
      user_id: userId,
      top_n: 10
    };

    // Add location data if available
    if (userLocation) {
      // Using type assertion to add dynamic properties
      (requestData as any)['latitude'] = userLocation.latitude;
      (requestData as any)['longitude'] = userLocation.longitude;
    }

    console.log('Sending search request:', requestData);
    console.log('API URL:', getApiUrl(API_ENDPOINTS.pathFinder.search));

    // Sende die Anfrage an das Backend
    const response = await fetchWithFallback(getApiUrl(API_ENDPOINTS.pathFinder.search), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: requestData }), // Nest request data under "data" field
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search results:', data);

    // Prüfe verschiedene mögliche Antwortformate
    if (data && data.jobs && Array.isArray(data.jobs)) {
      setResults(data.jobs);
    } else if (data && data.top_jobs && Array.isArray(data.top_jobs)) {
      setResults(data.top_jobs);
    } else if (Array.isArray(data)) {
      setResults(data);
    } else {
      console.warn('Unerwartetes Antwortformat:', data);
      setResults([]);
      setError('Die API-Antwort hat ein unerwartetes Format. Bitte versuchen Sie es später erneut.');
    }
  } catch (err: any) {
    console.error('Error searching jobs:', err);
    setError(`An error occurred during search: ${err.message || 'Unknown error'}`);
    setResults([]);
  } finally {
    setLoading(false);
  }
};

const toggleSaveJob = async (job: any) => {
  try {
    const endpoint = job.is_saved 
      ? getApiUrl(API_ENDPOINTS.pathFinder.unsaveJob)
      : getApiUrl(API_ENDPOINTS.pathFinder.saveJob);
    
    const payload = job.is_saved
      ? { data: { user_id: userId, job_id: job.id } }
      : { data: { user_id: userId, job_data: { ...job, id: job.id || undefined } } }; 
    
    const response = await fetchWithFallback(endpoint, {
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
  } catch (err: any) {
    console.error('Error saving/unsaving job:', err);
    Alert.alert('Error', `Could not ${job.is_saved ? 'unsave' : 'save'} job: ${err.message || 'Network error'}`);
  }
};

  const renderJobCard = (job: any) => (
    <View style={styles.resultCard}>
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={() => toggleSaveJob(job)}
      >
        <LinearGradient
          colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
          style={styles.saveButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons 
            name={job.is_saved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color="white" 
          />
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.jobCardContent}
        onPress={() => navigateToJobDetails(job.id)}
      >
        <Text style={styles.resultTitle}>{job.position || job.title || 'Job Title'}</Text>
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
    <ScrollView 
      style={styles.searchScrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.detailedSearchContainer}>
        <Text style={styles.inputLabel}>
          Job Title <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Software Developer"
          value={jobTitle}
          onChangeText={setJobTitle}
        />
        
        <Text style={styles.inputLabel}>
          Degree <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Bachelor"
          value={degree}
          onChangeText={setDegree}
        />
        
        <Text style={styles.inputLabel}>
          Work Experience (Years) <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.sliderContainer}>
          <CustomSlider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={yearsExperience}
            onValueChange={setYearsExperience}
            minimumTrackTintColor="#5A5D80"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#5A5D80"
          />
          <Text style={styles.sliderValue}>{yearsExperience}</Text>
        </View>
        
        <Text style={styles.inputLabel}>
          Search Radius (km) <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.sliderContainer}>
          <CustomSlider
            style={styles.slider}
            minimumValue={5}
            maximumValue={100}
            step={5}
            value={locationRadius}
            onValueChange={setLocationRadius}
            minimumTrackTintColor="#5A5D80"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#5A5D80"
          />
          <Text style={styles.sliderValue}>{locationRadius}</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Text style={styles.locationStatus}>
            {locationPermission 
              ? userLocation 
                ? 'Location available' 
                : 'Determining location...'
              : 'Location not available'
            }
          </Text>
          <GradientButton
            title={locationPermission ? 'Update' : 'Allow'}
            onPress={requestLocationPermission}
            small={true}
            style={{ minWidth: 100 }}
          />
        </View>
        
        <Text style={styles.inputLabel}>
          Interests (comma separated) <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="z.B. Python, JavaScript, React"
          value={interests}
          onChangeText={setInterests}
          multiline
        />
        <Text style={styles.inputHint}>
          Enter your skills and interests to get more relevant results.
        </Text>
        
        <GradientButton
          title="Search"
          onPress={handleSearch}
          disabled={!jobTitle || jobTitle.trim().length < 2}
          icon={<Ionicons name="search" size={20} color="#fff" />}
          style={{ marginTop: 16 }}
        />
      </View>
      
      <Text style={styles.sectionTitle}>Job Results</Text>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5A5D80" />
          <Text style={styles.loadingText}>Searching for jobs...</Text>
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && (!results || results.length === 0) && !error && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            Perform a search to see results.
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
          <ActivityIndicator size="large" color="#5A5D80" />
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
            <GradientButton
              title="Browse Jobs"
              onPress={() => setActiveTab('search')}
              style={{ marginTop: 8, alignSelf: 'center' }}
            />
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
      <HeaderWithToggle
        title="CareerDaddy"
        options={toggleOptions}
        activeOptionId={activeTab}
        onOptionChange={(tabId) => setActiveTab(tabId)}
      />
      
      {activeTab === 'search' ? renderSearchContent() : renderSavedJobsContent()}
    </View>
  );
}