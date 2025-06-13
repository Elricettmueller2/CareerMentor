import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SavedJobsScreen() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://192.168.178.29:8000';
  const userId = 'default_user'; // In a real app, this would come from authentication

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchSavedJobs(),
        fetchRecommendations()
      ]);
    } catch (err: any) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/saved_jobs/${userId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      setSavedJobs(data.saved_jobs || []);
    } catch (err: any) {
      console.error('Error fetching saved jobs:', err);
      throw err;
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
      throw err;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToJobDetails = (jobId: string) => {
    router.push(`/job-details?jobId=${jobId}`);
  };

  const renderJobCard = (job: any, isSaved: boolean = true) => (
    <TouchableOpacity 
      key={job.id} 
      style={styles.jobCard}
      onPress={() => navigateToJobDetails(job.id)}
    >
      {isSaved && (
        <View style={styles.savedBadge}>
          <Ionicons name="bookmark" size={12} color="#fff" />
        </View>
      )}
      
      <Text style={styles.jobTitle}>{job.title}</Text>
      <Text style={styles.companyName}>{job.company}</Text>
      
      <View style={styles.jobInfoRow}>
        {job.location && (
          <View style={styles.jobInfoItem}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.jobInfoText}>{job.location}</Text>
          </View>
        )}
        
        {job.job_type && (
          <View style={styles.jobInfoItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.jobInfoText}>{job.job_type}</Text>
          </View>
        )}
      </View>
      
      {job.description && (
        <Text style={styles.jobDescription} numberOfLines={2}>
          {job.description}
        </Text>
      )}
      
      {job.skills && typeof job.skills === 'string' && (
        <Text style={styles.jobSkills} numberOfLines={1}>
          Skills: {job.skills}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f95dc" />
        <Text style={styles.loadingText}>Loading your saved jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Saved Jobs</Text>
      
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Jobs</Text>
          {savedJobs.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                You haven't saved any jobs yet.
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Jobs you save will appear here.
              </Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => router.push('/(tabs)/pathfinder')}
              >
                <Text style={styles.browseButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {savedJobs.map(job => renderJobCard(job))}
            </View>
          )}
        </View>
        
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            {recommendations.map(job => renderJobCard(job, false))}
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
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
    padding: 16,
    backgroundColor: '#fff4f4',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  jobCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    position: 'relative',
  },
  savedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2f95dc',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    paddingRight: 28,
  },
  companyName: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  jobInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  jobInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  jobInfoText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  jobDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  jobSkills: {
    fontSize: 14,
    color: '#2f95dc',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#2f95dc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
