import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../config/api';

export default function JobDetailsScreen() {
  // Get parameters from the URL - supporting both id and jobId for backward compatibility
  const params = useLocalSearchParams();
  const jobId = params.id || params.jobId;
  
  // Debug the parameters being received
  console.log('Job details parameters:', params);
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
    if (!jobId) {
      console.error('No job ID provided!');
      setError('No job ID provided!');
      setLoading(false);
      return;
    }
    
    console.log(`Fetching job details for ID: ${jobId}`);
    setLoading(true);
    setError(null);
    
    try {
      // First try to get the job from saved jobs (which might have more complete data)
      const savedJobsUrl = getApiUrl(API_ENDPOINTS.pathFinder.savedJobs, { user_id: userId });
      let jobData = null;
      
      try {
        const savedJobsResponse = await fetch(savedJobsUrl);
        if (savedJobsResponse.ok) {
          const savedJobsData = await savedJobsResponse.json();
          const savedJobs = savedJobsData.jobs || [];
          const matchingJob = savedJobs.find((job: any) => job.id === jobId);
          
          if (matchingJob) {
            console.log('Found job in saved jobs');
            jobData = matchingJob;
            // Mark as saved since we found it in saved jobs
            jobData.is_saved = true;
          }
        }
      } catch (savedJobsError) {
        console.error('Error checking saved jobs:', savedJobsError);
        // Continue with regular job details fetch
      }
      
      // If not found in saved jobs, fetch from job details endpoint
      if (!jobData) {
        const apiUrl = getApiUrl(`${API_ENDPOINTS.pathFinder.jobDetails}/${jobId}`, { user_id: userId });
        console.log('API URL for job details:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response data:', JSON.stringify(data, null, 2));
        
        // Check different possible response formats
        jobData = data.job || data.data || data;
      }
      
      if (!jobData || (typeof jobData === 'object' && Object.keys(jobData).length === 0)) {
        console.error('Empty job data received');
        throw new Error('Invalid or empty job data received from API');
      }

      // Handle error in job data
      if (jobData.error) {
        console.error('Error in job data:', jobData.error);
        // Try to extract job ID from URL or params for better error handling
        throw new Error(`API returned an error: ${jobData.error}`);
      }

      // COMPANY NAME HANDLING - Critical for display
      // Ensure company name is properly set with multiple fallbacks
      if (!jobData.company_name || jobData.company_name === 'Unknown Company') {
        if (jobData.company && jobData.company !== 'Unknown Company') {
          jobData.company_name = jobData.company;
        } else if (jobData.employer && jobData.employer !== 'Unknown Company') {
          jobData.company_name = jobData.employer;
        } else if (jobData.company_details?.name) {
          jobData.company_name = jobData.company_details.name;
        } else if (jobData.description) {
          // Try to extract company name from description as last resort
          const companyMatches = jobData.description.match(/(?:at|for|by|with)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[,\.;]|\s+is|\s+are|\s+we|\s+in|$)/i);
          if (companyMatches && companyMatches[1] && companyMatches[1].length > 2 && companyMatches[1].length < 50) {
            jobData.company_name = companyMatches[1].trim();
          }
        }
      }

      // Ensure we have a title
      if (!jobData.title) {
        jobData.title = 'Job Position';
      }

      // Ensure we have a location - use original if available
      if (!jobData.location) {
        // Try to extract location from description if missing
        if (jobData.description) {
          const locationMatches = jobData.description.match(/(?:in|at|near|location[s:])\s+([A-Z][A-Za-z0-9\s,\.]+?)(?:[,\.;]|\s+and|\s+or|\s+with|$)/i);
          if (locationMatches && locationMatches[1] && locationMatches[1].length > 2 && locationMatches[1].length < 50) {
            jobData.location = locationMatches[1].trim();
          } else {
            jobData.location = 'Location not specified';
          }
        } else {
          jobData.location = 'Location not specified';
        }
      }

      // Ensure we have a description
      if (!jobData.description) {
        jobData.description = 'No detailed description available for this position.';
      }
      
      console.log('Processed job data:', JSON.stringify(jobData, null, 2));
      setJob(jobData);
      setIsSaved(jobData.is_saved || false);
    } catch (err: any) {
      setError(`Failed to load job details: ${err.message}`);
      console.error('Error fetching job details:', err.message);
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
      
      // Ensure job has an ID before saving
      if (!job.id && !isSaved) {
        job.id = `job-${Date.now()}`;
      }
      
      const payload = isSaved
        ? { data: { user_id: userId, job_id: job.id } }
        : { data: { user_id: userId, job_data: job } };
      
      console.log(`${isSaved ? 'Unsaving' : 'Saving'} job with ID:`, job.id);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Job ${isSaved ? 'unsaved' : 'saved'} result:`, result);
      
      // Update the local state
      setIsSaved(!isSaved);
      
      // Show brief confirmation
      Alert.alert(
        isSaved ? 'Job Removed' : 'Job Saved', 
        isSaved ? 'This job has been removed from your saved jobs.' : 'This job has been added to your saved jobs.',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (err: any) {
      console.error(`Error ${isSaved ? 'unsaving' : 'saving'} job:`, err);
      Alert.alert('Error', `Failed to ${isSaved ? 'remove' : 'save'} job: ${err.message}`);
    } finally {
      setSavingJob(false);
    }
  };

  const handleOpenJobListing = () => {
    if (!job) {
      Alert.alert(
        'Job Information Missing',
        'Sorry, complete job information is not available.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Try different possible fields for the job URL
    const jobUrl = job.application_link || job.url || job.job_url || job.link;
    
    if (!jobUrl) {
      Alert.alert(
        'Job Listing URL Missing',
        'Sorry, no link to the original job listing is available.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Linking.openURL(jobUrl).catch(err => {
      console.error('Error opening URL:', err);
      Alert.alert('Error', `Could not open the job listing: ${err.message}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A5D80" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.applyButton} onPress={fetchJobDetails}>
          <Text style={styles.applyButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyButton, { backgroundColor: '#888', marginTop: 10 }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.applyButtonText}>Go Back</Text>
        </TouchableOpacity>
        <View style={styles.errorDetailsContainer}>
          <Text style={styles.errorDetailsTitle}>Debug Information:</Text>
          <Text style={styles.errorDetailsText}>Job ID: {jobId || 'Not provided'}</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No job information available.</Text>
        <TouchableOpacity style={styles.applyButton} onPress={fetchJobDetails}>
          <Text style={styles.applyButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyButton, { backgroundColor: '#888', marginTop: 10 }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.applyButtonText}>Go Back</Text>
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
            size={18} 
            color={isSaved ? "#5A5D80" : "#5A5D80"} 
          />
          <Text style={[styles.saveButtonText, isSaved ? styles.savedButtonText : {}]}>
            {savingJob ? 'Processing...' : (isSaved ? 'Saved' : 'Save Job')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.jobTitle}>{job.title || 'Job Position'}</Text>
        
        <Text style={styles.companyName}>
          {job.company_name || job.company || job.employer || 'Company Information Unavailable'}
        </Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{job.location || 'Location not specified'}</Text>
          </View>
          
          {job.salary && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{job.salary}</Text>
            </View>
          )}
          
          {job.match_score && (
            <View style={styles.matchScoreContainer}>
              <Ionicons name="star" size={16} color="#5A5D80" />
              <Text style={styles.matchScoreText}>{job.match_score}% Match</Text>
            </View>
          )}
        </View>

        {job.status && (
          <View style={{ backgroundColor: '#f0f0f8', padding: 8, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#5A5D80', fontWeight: '500' }}>Status: {job.status}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {job.description || 'No detailed description available for this position.'}
          </Text>
        </View>

        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.requirementsText}>{job.requirements}</Text>
          </View>
        )}

        {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {job.skills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{skill}</Text>
                </View>
              ))}
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
            onPress={handleOpenJobListing}
          >
            <Text style={styles.applyButtonText}>Open Job Listing</Text>
          </TouchableOpacity>
          <Text style={styles.postedDate}>
            Posted: {job.posted_date || 'Recently'}
          </Text>
        </View>

        {/* Debug information - only shown in development mode */}
        {__DEV__ && (
          <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#666' }}>Debug Information</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>Job ID: {job.id || 'Unknown'}</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>Source: {job.source || 'Unknown'}</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>Saved: {isSaved ? 'Yes' : 'No'}</Text>
            <Text style={{ fontSize: 12, color: '#888' }}>Has URL: {job.application_link || job.url || job.job_url || job.link ? 'Yes' : 'No'}</Text>
          </View>
        )}
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
  errorDetailsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#888',
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
