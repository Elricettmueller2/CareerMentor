import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InsightCard from './InsightCard';
import AnimatedLoadingText from './AnimatedLoadingText';
import { PatternInsight } from '../../services/TrackPalService';

interface AIInsightsSectionProps {
  insights: PatternInsight[];
  loading: boolean;
  onRefresh: () => void;
}

const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({
  insights,
  loading,
  onRefresh,
}) => {
  return (
    <View style={styles.aiInsightsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.insightsSectionTitle}>AI Insights</Text>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Ionicons name="refresh" size={20} color="#4a6da7" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4a6da7" />
          <AnimatedLoadingText style={styles.insightLoadingText} type="insights" />
        </View>
      ) : (
        <View style={styles.insightsContainer}>
          {insights.map((insight) => (
            <InsightCard 
              key={insight.id}
              id={insight.id}
              icon={insight.icon}
              content={insight.content}
            />
          ))}
          
          {insights.length === 0 && (
            <Text style={styles.noInsightsText}>
              No insights available. Please refresh.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  aiInsightsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  insightLoadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  noInsightsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 15,
  },
});

export default AIInsightsSection;
