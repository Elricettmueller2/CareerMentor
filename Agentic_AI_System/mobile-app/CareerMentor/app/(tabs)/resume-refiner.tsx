import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';

export default function ResumeRefinerScreen() {
  const [uploadStarted, setUploadStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<Array<{text: string, section: string}>>([]);
  const [jobText, setJobText] = useState('');
  const [matchResult, setMatchResult] = useState<{match_score: number, missing_keywords: string[], suggestions: string[]} | null>(null);
  const [uploadId, setUploadId] = useState<string>('');

  const API_BASE_URL = 'http://localhost:8000';

  const pickAndUpload = async () => {
    setLoading(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.type === 'success') {
        const uri = res.uri;
        const file = await fetch(uri);
        const blob = await file.blob();
        const form = new FormData();
        form.append('file', blob, res.name);

        const resp = await fetch(`${API_BASE_URL}/resumes/upload`, {
          method: 'POST',
          body: form
        });
        const data = await resp.json();
        setUploadId(data.upload_id);
        setUploadStarted(true);
        analyzeResume(data.upload_id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const analyzeResume = async (id: string) => {
    setLoading(true);
    try {
      // Parse
      const parseResp = await fetch(`${API_BASE_URL}/agents/resume_refiner/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { upload_id: id } })
      });
      const parseData = await parseResp.json();
      // Refine
      const refResp = await fetch(`${API_BASE_URL}/agents/resume_refiner/refine/${id}`, {
        method: 'POST'
      });
      const refData = await refResp.json();
      const fb = refData.response;
      const msgs: Array<{ text: string, section: string }> = [];
      Object.entries(fb).forEach(([section, tips]) => {
        (tips as string[]).forEach(tip => {
          msgs.push({ section, text: tip });
        });
      });
      setFeedbackMessages(msgs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const matchResume = async () => {
    if (!uploadStarted) return;
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/agents/resume_refiner/match/${uploadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { job_text: jobText } })
      });
      const data = await resp.json();
      setMatchResult(data.response);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resume Refiner</Text>

      {!uploadStarted ? (
        <View style={styles.setupContainer}>
          <TouchableOpacity style={styles.button} onPress={pickAndUpload} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload PDF Resume</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.chatContainer}>
          {loading && <ActivityIndicator size="large" />}
          {feedbackMessages.map((msg, index) => (
            <View key={index} style={styles.messageBubble}>
              <Text style={styles.messageText}>[{msg.section}] {msg.text}</Text>
            </View>
          ))}

          <Text style={styles.sectionHeader}>Job Match</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste job description..."
            multiline
            value={jobText}
            onChangeText={setJobText}
          />
          <TouchableOpacity style={styles.button} onPress={matchResume} disabled={loading}>
            <Text style={styles.buttonText}>Match Resume to Job</Text>
          </TouchableOpacity>

          {matchResult && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Match Score: {(matchResult.match_score * 100).toFixed(1)}%</Text>
              <Text style={styles.cardSubtitle}>Missing Keywords:</Text>
              {matchResult.missing_keywords.map((kw, i) => (
                <Text key={i} style={styles.cardText}>• {kw}</Text>
              ))}
              <Text style={styles.cardSubtitle}>Suggestions:</Text>
              {matchResult.suggestions.map((s, i) => (
                <Text key={i} style={styles.cardText}>• {s}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginVertical: 10 },
  button: { backgroundColor: '#2f95dc', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  chatContainer: { flex: 1 },
  messageBubble: { backgroundColor: '#e5e5ea', padding: 10, borderRadius: 5, marginVertical: 5 },
  messageText: { fontSize: 16 },
  sectionHeader: { fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 5, marginVertical: 10 },
  cardTitle: { fontSize: 18, fontWeight: '500' },
  cardSubtitle: { fontSize: 16, fontWeight: '500', marginTop: 10 },
  cardText: { fontSize: 14, marginVertical: 2 },
});