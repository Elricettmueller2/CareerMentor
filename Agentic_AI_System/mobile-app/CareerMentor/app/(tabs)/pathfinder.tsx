import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Keyboard, View } from 'react-native';
import { Text } from '@/components/Themed';

export default function PathFinderScreen() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:8000';

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    Keyboard.dismiss();
    try {
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/search_jobs_online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { query: search.trim() } }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setResults(data.jobs || []);
    } catch (err: any) {
      setError('Fehler beim Laden der Jobs. Stelle sicher, dass das Backend läuft.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Path Finder</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a job (e.g. Software Developer)"
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Suggestions</Text>
      {loading && <ActivityIndicator style={{ marginVertical: 24 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && results.length === 0 && !error && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: '#888', textAlign: 'center' }}>No results yet. Try searching for a job title.</Text>
        </View>
      )}

      <ScrollView style={styles.resultsContainer} keyboardShouldPersistTaps="handled">
        {results.map((job, idx) => (
          <View key={idx} style={styles.resultCard}>
            <Text style={styles.resultTitle}>{job.title || 'Job Title'}</Text>
            <Text style={styles.resultCompany}>{job.company || ''}{job.location ? ` | ${job.location}` : ''}</Text>
            {job.description && (
              <Text style={styles.resultDescription}>{job.description}</Text>
            )}
            {job.skills && (
              <Text style={styles.resultSkills}>{job.skills}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#2f95dc',
    borderRadius: 8,
    paddingVertical: 10,
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
    marginTop: 8,
  },
  errorText: {
    color: '#ff3b30',
    marginVertical: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fafaff',
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
    color: '#6c6690',
  },
});
