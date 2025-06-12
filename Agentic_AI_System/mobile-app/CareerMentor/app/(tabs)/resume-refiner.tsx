import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';

export default function ResumeRefinerScreen() {
  console.log("🏁 ResumeRefinerScreen rendered");
  const [uploadStarted, setUploadStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<Array<{text: string, section: string}>>([]);
  const [jobText, setJobText] = useState('');
  const [matchResult, setMatchResult] = useState<{match_score: number, missing_keywords: string[], suggestions: string[]} | null>(null);
  const [uploadId, setUploadId] = useState<string>('');

  const API_BASE_URL = 'http://192.168.178.24:8000';

  const pickAndUpload = async () => {
    console.log("🖱️ Upload button pressed");
    setLoading(true);
  
    try {
      // Launch document picker
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      console.log("📄 Picker result:", res);
  
      // Handle new Expo DocumentPicker API
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const uri = asset.uri;
        const name = asset.name;
  
        // Fetch file data and build form
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();
        const form = new FormData();
        form.append('file', blob, name);
  
        // Upload to backend
        console.log("🔗 POST →", `${API_BASE_URL}/resumes/upload`);
        const resp = await fetch(`${API_BASE_URL}/resumes/upload`, {
          method: 'POST',
          body: form,
        });
  
        // Log response for debugging
        console.log("⏳ Upload status:", resp.status);
        const text = await resp.text();
        console.log("📥 Response body:", text);
  
        // Parse JSON and proceed
        const data = JSON.parse(text);
        setUploadId(data.upload_id);
        setUploadStarted(true);
        analyzeResume(data.upload_id);
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async (id: string) => {
    setLoading(true);
    try {
      // Parse
      console.log(`🔍 Calling parse endpoint with upload_id: ${id}`);
      const parseResp = await fetch(`${API_BASE_URL}/agents/resume_refiner/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { upload_id: id } })
      });
      
      console.log(`📊 Parse response status: ${parseResp.status}`);
      // Get the raw text first for debugging
      const parseRawText = await parseResp.text();
      console.log(`📥 Parse response body: ${parseRawText.substring(0, 200)}...`);
      
      // Skip the refine step for now until we fix the parse step
      if (parseResp.status !== 200) {
        console.error(`❌ Parse request failed with status: ${parseResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume parsing failed. Server returned status ${parseResp.status}. Please try again later.` 
        }]);
        return;
      }
      
      try {
        // Try to parse the JSON response
        const parseData = JSON.parse(parseRawText);
        console.log('✅ Successfully parsed JSON response');
        
        // Now try the refine step
        console.log(`🔄 Calling refine endpoint with id: ${id}`);
        const refResp = await fetch(`${API_BASE_URL}/agents/resume_refiner/refine/${id}`, {
          method: 'POST'
        });
        
        console.log(`📊 Refine response status: ${refResp.status}`);
        const refRawText = await refResp.text();
        console.log(`📥 Refine response body: ${refRawText.substring(0, 200)}...`);
        
        if (refResp.status !== 200) {
          console.error(`❌ Refine request failed with status: ${refResp.status}`);
          setFeedbackMessages([{ 
            section: 'Error', 
            text: `Resume refinement failed. Server returned status ${refResp.status}. Please try again later.` 
          }]);
          return;
        }
        
        try {
          const refData = JSON.parse(refRawText);
          console.log('✅ Successfully parsed refine JSON response');
          
          const fb = refData.response;
          if (!fb) {
            console.error('❌ No response field in refine data');
            setFeedbackMessages([{ 
              section: 'Error', 
              text: 'Resume refinement returned an invalid response. Please try again later.' 
            }]);
            return;
          }
          
          const msgs: Array<{ text: string, section: string }> = [];
          Object.entries(fb).forEach(([section, tips]) => {
            if (Array.isArray(tips)) {
              (tips as string[]).forEach(tip => {
                msgs.push({ section, text: tip });
              });
            } else {
              console.warn(`⚠️ Tips for section ${section} is not an array:`, tips);
            }
          });
          
          setFeedbackMessages(msgs.length > 0 ? msgs : [{ 
            section: 'Info', 
            text: 'Resume analyzed successfully, but no specific feedback was provided.' 
          }]);
        } catch (jsonError) {
          console.error('❌ Failed to parse refine response as JSON:', jsonError);
          setFeedbackMessages([{ 
            section: 'Error', 
            text: 'Failed to process the refinement results. The server response was not valid JSON.' 
          }]);
        }
      } catch (jsonError) {
        console.error('❌ Failed to parse parse response as JSON:', jsonError);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: 'Failed to process the parsing results. The server response was not valid JSON.' 
        }]);
      }
    } catch (e) {
      console.error('❌ Network or other error:', e);
      setFeedbackMessages([{ 
        section: 'Error', 
        text: `An error occurred: ${e.message}. Please check your connection and try again.` 
      }]);
    } finally {
      setLoading(false);
    }
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