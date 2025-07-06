import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../config/api';

// Definiere den Job-Typ
interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  requirements: string;
  salary: string;
  application_link: string;
  resume_match_score?: number;
  is_saved?: boolean;
}

export default function JobSearchScreen() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState('');
  const [educationLevel, setEducationLevel] = useState('Bachelor');
  const [yearsExperience, setYearsExperience] = useState('3');
  const [locationRadius, setLocationRadius] = useState('50');
  const [interestPoints, setInterestPoints] = useState('Python, JavaScript');
  
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  // Funktion zum Durchführen der Jobsuche
  const searchJobs = async () => {
    if (!jobTitle.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Jobtitel ein.');
      return;
    }

    setLoading(true);
    setJobs([]);
    setSearchPerformed(true);

    try {
      // Bereite die Daten für die API-Anfrage vor
      const interestPointsList = interestPoints
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const requestData = {
        job_title: jobTitle,
        education_level: educationLevel,
        years_experience: parseInt(yearsExperience) || 0,
        location_radius: parseInt(locationRadius) || 50,
        interest_points: interestPointsList,
        user_id: 'default_user',
        top_n: 10
      };

      console.log('Sending search request:', requestData);

      // Sende die Anfrage an das Backend
      const response = await fetch(getApiUrl(API_ENDPOINTS.pathFinder.search), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Search results:', data);

      if (data && data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
        console.warn('No jobs found or invalid response format');
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      Alert.alert('Fehler', 'Bei der Jobsuche ist ein Fehler aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Speichern eines Jobs
  const saveJob = async (job: Job) => {
    setSavingJobId(job.id);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.pathFinder.saveJob), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            user_id: 'default_user',
            job_data: job
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Aktualisiere den Job-Status in der lokalen Liste
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id ? { ...j, is_saved: true } : j
        )
      );

      Alert.alert('Erfolg', 'Der Job wurde gespeichert.');
    } catch (error) {
      console.error('Error saving job:', error);
      Alert.alert('Fehler', 'Beim Speichern des Jobs ist ein Fehler aufgetreten.');
    } finally {
      setSavingJobId(null);
    }
  };

  // Funktion zum Navigieren zur Job-Detailseite
  const viewJobDetails = (jobId: string) => {
    router.push(`/job-details?jobId=${jobId}`);
  };

  // Render-Funktion für einen einzelnen Job
  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity 
      style={styles.jobCard} 
      onPress={() => viewJobDetails(item.id)}
    >
      <View style={styles.jobCardHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            item.is_saved ? styles.savedButton : {}
          ]}
          onPress={() => !item.is_saved && saveJob(item)}
          disabled={savingJobId === item.id || item.is_saved}
        >
          <Ionicons 
            name={item.is_saved ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={item.is_saved ? "#fff" : "#5A5D80"} 
          />
          <Text style={[
            styles.saveButtonText, 
            item.is_saved ? styles.savedButtonText : {}
          ]}>
            {savingJobId === item.id ? 'Speichern...' : (item.is_saved ? 'Gespeichert' : 'Speichern')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.companyName}>{item.company_name}</Text>
      <Text style={styles.location}>{item.location}</Text>
      
      <Text style={styles.description} numberOfLines={3}>
        {item.description}
      </Text>
      
      {item.resume_match_score !== undefined && (
        <View style={styles.matchScoreContainer}>
          <Text style={styles.matchScoreLabel}>Match-Score:</Text>
          <View style={styles.matchScoreBadge}>
            <Text style={styles.matchScoreText}>
              {Math.round(item.resume_match_score)}%
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Job-Suche</Text>
          <Text style={styles.subtitle}>
            Finde deinen Traumjob mit KI-basierter Suche
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jobtitel</Text>
            <TextInput
              style={styles.input}
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="z.B. Software Developer"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bildungsabschluss</Text>
            <TextInput
              style={styles.input}
              value={educationLevel}
              onChangeText={setEducationLevel}
              placeholder="z.B. Bachelor"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Berufserfahrung (Jahre)</Text>
              <TextInput
                style={styles.input}
                value={yearsExperience}
                onChangeText={setYearsExperience}
                placeholder="z.B. 3"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Suchradius (km)</Text>
              <TextInput
                style={styles.input}
                value={locationRadius}
                onChangeText={setLocationRadius}
                placeholder="z.B. 50"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interessengebiete (durch Komma getrennt)</Text>
            <TextInput
              style={styles.input}
              value={interestPoints}
              onChangeText={setInterestPoints}
              placeholder="z.B. Python, JavaScript, React"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={searchJobs}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.searchButtonText}>Suchen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {searchPerformed && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {loading ? 'Suche läuft...' : 
                jobs.length > 0 ? `${jobs.length} Jobs gefunden` : 'Keine Jobs gefunden'}
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#5A5D80" style={styles.loadingIndicator} />
            ) : jobs.length > 0 ? (
              <FlatList
                data={jobs}
                renderItem={renderJobItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>
                  Keine passenden Jobs gefunden. Versuche es mit anderen Suchkriterien.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#5A5D80',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: '#5A5D80',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  loadingIndicator: {
    marginTop: 20,
    marginBottom: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  jobCard: {
    backgroundColor: '#5A5D80',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  savedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 12,
    color: '#5A5D80',
    marginLeft: 4,
  },
  savedButtonText: {
    color: '#fff',
  },
  companyName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  matchScoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  matchScoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
