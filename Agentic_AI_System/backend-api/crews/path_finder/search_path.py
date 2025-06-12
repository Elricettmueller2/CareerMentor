import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Keyboard, View } from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';

export default function PathFinderScreen() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:8000';
  const router = useRouter();

  // Autosuggest: Hole Vorschläge beim Tippen
  const handleSuggest = async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/suggest_roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { query: text } }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  };

  // Suche echte Jobs
  const handleSearch = async (query?: string) => {
    const q = query || search;
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSuggestions([]);
    Keyboard.dismiss();
    try {
      const response = await fetch(`${API_BASE_URL}/agents/path_finder/search_jobs_online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { query: q.trim() } }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setResults(data.jobs || []);
    } catch (err: any) {
      setError('Fehler beim Laden der Jobs. Stelle sicher, dass das Backend läuft.');
    }
    setLoading(false);
  };

  // Navigiere zur Detailseite
  const openJobDetail = (job: any) => {
    router.push({
      pathname: '/job-detail',
      params: { job: JSON.stringify(job) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PathFinder</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a job (e.g. Software Engineer)"
          placeholderTextColor="#888"
          value={search}
          onChangeText={handleSuggest}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()} disabled={loading}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Vorschläge beim Tippen */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s, idx) => (
            <TouchableOpacity key={idx} onPress={() => { setSearch(s); setSuggestions([]); handleSearch(s); }}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Suggestions</Text>
      {loading && <ActivityIndicator style={{ marginVertical: 24 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Ergebnisse */}
      <ScrollView style={styles.resultsContainer} keyboardShouldPersistTaps="handled">
        {results.map((job, idx) => (
          <TouchableOpacity key={idx} style={styles.resultCard} onPress={() => openJobDetail(job)}>
            <Text style={styles.resultTitle}>{job.title || 'Job Title'}</Text>
            <Text style={styles.resultCompany}>{job.company || ''}{job.location ? ` | ${job.location}` : ''}</Text>
            {job.skills && (
              <Text style={styles.resultSkills}>{job.skills}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#faf6ff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#6c6690',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  suggestionsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbb',
    marginBottom: 12,
    marginTop: -8,
    zIndex: 10,
  },
  suggestionText: {
    padding: 12,
    fontSize: 16,
    color: '#6c6690',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  errorText: { color: '#ff3b30', marginVertical: 16, textAlign: 'center' },
  resultsContainer: { flex: 1 },
  resultCard: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#222' },
  resultCompany: { fontSize: 15, color: '#666', marginBottom: 8 },
  resultSkills: { fontSize: 14, color: '#6c6690' },