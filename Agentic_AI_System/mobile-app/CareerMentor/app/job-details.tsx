import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../config/api';

export default function JobDetailsScreen() {
  const { jobId } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  // Verwende die IP-Adresse statt localhost für den Zugriff von mobilen Geräten
  // API-URLs werden jetzt zentral in config/api.ts verwaltet
  const userId = 'default_user'; // In a real app, this would come from authentication

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.pathFinder.jobDetails}/${jobId}`, { user_id: userId }));
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      setJob(data.job);
      setIsSaved(data.job.is_saved || false);
    } catch (err: any) {
      setError('Failed to load job details. Please try again.');
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveJob = async () => {
    if (!job) return;
    
    setSavingJob(true);
    try {
      const endpoint = isSaved
        ? getApiUrl(API_ENDPOINTS.pathFinder.unsaveJob)
        : getApiUrl(API_ENDPOINTS.pathFinder.saveJob);
      
      const payload = isSaved
        ? { data: { user_id: userId, job_id: job.id } }
        : { data: { user_id: userId, job_data: job } };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      setIsSaved(!isSaved);
    } catch (err: any) {
      console.error('Error saving/unsaving job:', err);
      Alert.alert('Error', 'Failed to save job. Please try again.');
    } finally {
      setSavingJob(false);
    }
  };

  const handleApplyNow = () => {
    if (job && job.application_link) {
      Linking.openURL(job.application_link).catch(err => {
        console.error('Error opening application link:', err);
        Alert.alert('Error', 'Could not open application link.');
      });
    } else {
      Alert.alert('Info', 'No application link available for this job.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A5D80" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, isSaved ? styles.savedButton : {}]} 
          onPress={toggleSaveJob}
          disabled={savingJob}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={isSaved ? "#5A5D80" : "#fff"} 
          />
          <Text style={[styles.saveButtonText, isSaved ? styles.savedButtonText : {}]}>
            {savingJob ? 'Saving...' : (isSaved ? 'Saved' : 'Save Job')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.companyName}>{job.company_name}</Text>
        
        <View style={styles.infoRow}>
          {job.location && (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{job.location}</Text>
            </View>
          )}
          
          {job.salary && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{job.salary}</Text>
            </View>
          )}
          
          {job.job_type && (
            <View style={styles.infoItem}>
              <Ionicons name="briefcase-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{job.job_type}</Text>
            </View>
          )}

          {job.resume_match_score !== undefined && (
            <View style={styles.matchScoreContainer}>
              <Ionicons name="star" size={18} color="#5A5D80" />
              <Text style={styles.matchScoreText}>
                {Math.round(job.resume_match_score)}% Match
              </Text>
            </View>
          )}
        </View>
        
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        )}
        
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.requirementsText}>{job.requirements}</Text>
          </View>
        )}
        
        {job.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {typeof job.skills === 'string' ? (
                <Text style={styles.skillsText}>{job.skills}</Text>
              ) : (
                job.skills.map((skill: string, index: number) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillBadgeText}>{skill}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.benefitsText}>{job.benefits}</Text>
          </View>
        )}

        <View style={styles.applySection}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApplyNow}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
          <Text style={styles.postedDate}>
            Posted: {job.posted_date || 'Recently'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#5A5D80',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  savedButton: {
    backgroundColor: '#fff',
  },
  saveButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#5A5D80',
  },
  savedButtonText: {
    color: '#5A5D80',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    color: '#444',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 93, 128, 0.1)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 16,
  },
  matchScoreText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#5A5D80',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  requirementsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillsText: {
    fontSize: 15,
    color: '#444',
  },
  skillBadge: {
    backgroundColor: 'rgba(90, 93, 128, 0.1)',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 4,
  },
  skillBadgeText: {
    fontSize: 14,
    color: '#5A5D80',
  },
  benefitsText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  applySection: {
    marginTop: 16,
    marginBottom: 40,
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#5A5D80',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postedDate: {
    fontSize: 14,
    color: '#888',
  },
});
