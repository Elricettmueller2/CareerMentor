import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, View, Dimensions, SafeAreaView } from 'react-native';
import { Text } from '@/components/Themed';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ResumeRefinerScreen() {
  console.log("🏁 ResumeRefinerScreen rendered");
  const [uploadStarted, setUploadStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<'parsing' | 'analysing' | ''>('parsing');
  const [loadingDots, setLoadingDots] = useState('');
  const [feedbackMessages, setFeedbackMessages] = useState<Array<{text: string, section: string}>>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState<{match_score: number, missing_keywords: string[], suggestions: string[]} | null>(null);
  const [uploadId, setUploadId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analyse' | 'match'>('analyse');
  
  // Simulate loading progress
  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval>;
    
    if (loading) {
      setLoadingProgress(0);
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          // Ensure progress increases steadily
          const increment = prev < 30 ? 1 : prev < 60 ? 0.7 : prev < 90 ? 0.5 : 0.2;
          const newValue = prev + increment;
          
          if (newValue >= 100) {
            return 99; // Keep at 99% until actually complete
          }
          return newValue;
        });
      }, 200);
    } else {
      setLoadingProgress(0);
      setLoadingStage('');
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [loading]);
  
  // Animate loading dots
  useEffect(() => {
    let dotsInterval: ReturnType<typeof setInterval>;
    
    if (loading) {
      dotsInterval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, 500);
    } else {
      setLoadingDots('');
    }
    
    return () => {
      if (dotsInterval) clearInterval(dotsInterval);
    };
  }, [loading]);
  
  // New state for category scores
  const [categoryScores, setCategoryScores] = useState<{
    format_layout: number;
    inhalt_struktur: number;
    sprache_stil: number;
    ergebnis_orientierung: number;
    overall: number;
  } | null>(null);

  const API_BASE_URL = 'http://192.168.178.24:8000';

  const pickAndUpload = async () => {
    console.log("🖱️ Upload button pressed");
    
    try {
      // Launch document picker without setting loading state yet
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      console.log("📄 Picker result:", res);
  
      // Handle new Expo DocumentPicker API
      if (!res.canceled && res.assets && res.assets.length > 0) {
        // Only start loading after user has selected a file
        setLoading(true);
        setLoadingStage('parsing');
        
        const asset = res.assets[0];
        const uri = asset.uri;
        const name = asset.name;
  
        try {
          console.log("📄 Using direct file URI approach for React Native");
          
          // Create FormData with the file directly from URI
          // This is the recommended approach for React Native
          const form = new FormData();
          
          // Use a more explicit way to append the file to FormData for React Native
          form.append('file', {
            uri: uri,
            name: name,
            type: 'application/pdf'
          } as any);
          
          console.log("📄 FormData created with file:", name);
          
          // Upload to backend with explicit headers
          console.log("🔗 POST →", `${API_BASE_URL}/resumes/upload`);
          const resp = await fetch(`${API_BASE_URL}/resumes/upload`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              // Don't set Content-Type when using FormData with files
            },
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
        } catch (e: any) {
          console.error("File upload error:", e);
          setFeedbackMessages([{ 
            section: 'Error', 
            text: `An error occurred during file upload: ${e?.message || 'Unknown error'}` 
          }]);
        }
      } else {
        // User cancelled the picker, don't show loading
        console.log("📄 User cancelled file picking");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      setLoading(false);
    }
  };

  const analyzeResume = async (id: string) => {
    setLoading(true);
    setLoadingStage('parsing');
    try {
      // Step 1: Analyze layout
      console.log(`🔍 Analyzing layout with upload_id: ${id}`);
      const layoutResp = await fetch(`${API_BASE_URL}/resumes/${id}/layout`);
      
      if (layoutResp.status !== 200) {
        console.error(`❌ Layout analysis failed with status: ${layoutResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Layout analysis failed. Server returned status ${layoutResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const layoutData = await layoutResp.json();
      console.log('✅ Successfully analyzed layout:', layoutData);
      
      // Step 2: Parse resume
      console.log(`🔍 Parsing resume with upload_id: ${id}`);
      setLoadingStage('parsing');
      const parseResp = await fetch(`${API_BASE_URL}/resumes/${id}/parse`);
      
      if (parseResp.status !== 200) {
        console.error(`❌ Parse request failed with status: ${parseResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume parsing failed. Server returned status ${parseResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const parseData = await parseResp.json();
      console.log('✅ Successfully parsed resume:', parseData);
      
      // Step 3: Evaluate resume quality
      console.log(`🔄 Evaluating resume quality with id: ${id}`);
      setLoadingStage('analysing');
      const evalResp = await fetch(`${API_BASE_URL}/resumes/${id}/evaluate`);
      
      if (evalResp.status !== 200) {
        console.error(`❌ Evaluation request failed with status: ${evalResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume evaluation failed. Server returned status ${evalResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const evalData = await evalResp.json();
      console.log('✅ Successfully evaluated resume:', evalData);
      
      // Process evaluation data
      const responseData = evalData.response;
      
      // Update category scores directly from API response
      if (responseData.scores) {
        setCategoryScores({
          format_layout: responseData.scores.format_layout || 0,
          inhalt_struktur: responseData.scores.inhalt_struktur || 0,
          sprache_stil: responseData.scores.sprache_stil || 0,
          ergebnis_orientierung: responseData.scores.ergebnis_orientierung || 0,
          overall: responseData.scores.overall || 0
        });
      } else {
        console.warn('⚠️ No scores found in evaluation response');
        setCategoryScores(null);
      }
      
      // Update feedback messages directly from API response
      const messages = [];
      if (responseData.feedback) {
        Object.entries(responseData.feedback).forEach(([category, items]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              messages.push({
                section: formatCategoryName(category),
                text: item
              });
            });
          }
        });
        setFeedbackMessages(messages);
      } else {
        console.log('No feedback found in evaluation response');
        setFeedbackMessages([{ 
          section: 'Info', 
          text: 'No feedback available for this resume.' 
        }]);
      }
      
    } catch (e: any) {
      console.error("Analysis error:", e);
      setFeedbackMessages([{ 
        section: 'Error', 
        text: `An unexpected error occurred during resume analysis: ${e?.message || 'Unknown error'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format category names for display
  const formatCategoryName = (category) => {
    const mapping = {
      'format_layout': 'Format & Layout',
      'inhalt_struktur': 'Content & Structure',
      'sprache_stil': 'Language & Style',
      'ergebnis_orientierung': 'Result Orientation'
    };
    return mapping[category] || category;
  };
  const matchWithJob = async () => {
    if (!uploadId || !jobDescription.trim()) {
      setFeedbackMessages([{ 
        section: 'Error', 
        text: 'Please upload a resume and enter a job description first.' 
      }]);
      return;
    }
    
    setLoading(true);
    try {
      // Prepare job data in the format expected by the API
      const jobData = {
        job_descriptions: [
          {
            job_id: 'job1',
            job_title: 'Job Position',
            job_summary: jobDescription
          }
        ]
      };
      
      console.log(`🔍 Matching resume with job description, upload_id: ${uploadId}`);
      const matchResp = await fetch(`${API_BASE_URL}/resumes/${uploadId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      
      if (matchResp.status !== 200) {
        console.error(`❌ Match request failed with status: ${matchResp.status}`);
        setFeedbackMessages([{ 
          section: 'Error', 
          text: `Resume matching failed. Server returned status ${matchResp.status}. Please try again later.` 
        }]);
        setLoading(false);
        return;
      }
      
      const matchData = await matchResp.json();
      console.log('✅ Successfully matched resume with job:', matchData);
      
      // Process match data directly from API response
      const responseData = matchData.response;
      if (responseData && responseData.length > 0) {
        const jobMatch = responseData[0];
        
        // Use only data directly from the API response
        setMatchResult({
          match_score: jobMatch.overall_score || 0,
          missing_keywords: jobMatch.missing_skills || [],
          suggestions: jobMatch.matching_skills || []
        });
      } else {
        console.warn('⚠️ No match results found in response');
        setFeedbackMessages(prev => [...prev, { 
          section: 'Match Results', 
          text: 'No match results available. The job description may be too short or not specific enough.' 
        }]);
        setMatchResult(null);
      }
      
    } catch (e: any) {
      console.error("Match error:", e);
      setFeedbackMessages([{ 
        section: 'Error', 
        text: `An unexpected error occurred during job matching: ${e?.message || 'Unknown error'}` 
      }]);
      setMatchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 33) return styles.scoreBarLow;
    else if (score < 66) return styles.scoreBarMedium;
    else return styles.scoreBarHigh;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Resume Refiner</Text>
      
        {uploadStarted && !loading && feedbackMessages.length > 0 && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'analyse' && styles.activeTabButton]}
            onPress={() => setActiveTab('analyse')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'analyse' && styles.activeTabText]}>Analyse</Text>
            {activeTab === 'analyse' && <LinearGradient 
              colors={['#6a11cb', '#2575fc']} 
              style={styles.activeTabIndicator} 
            />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'match' && styles.activeTabButton]}
            onPress={() => setActiveTab('match')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'match' && styles.activeTabText]}>Match</Text>
            {activeTab === 'match' && <LinearGradient 
              colors={['#6a11cb', '#2575fc']} 
              style={styles.activeTabIndicator} 
            />}
          </TouchableOpacity>
        </View>
      )}

      {!uploadStarted && !loading ? (
        <View style={styles.setupContainer}>
          <Text style={styles.uploadMessage}>Please upload your CV to personalize your experience and improve your CV</Text>
          <TouchableOpacity style={styles.uploadButtonContainer} onPress={pickAndUpload} disabled={loading}>
            <LinearGradient
              colors={['#C29BB8', '#8089B4']}
              style={styles.uploadButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Upload CV</Text>
                  <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {loadingStage === 'parsing' ? `Parsing CV${loadingDots}` : `Analysing CV${loadingDots}`}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
          </View>
        </View>
      ) : feedbackMessages.length > 0 ? (
        <ScrollView style={styles.chatContainer}>
          {/* Loading indicator moved to its own conditional rendering block */}
          
          {/* Display category scores if available */}
          {activeTab === 'analyse' && categoryScores && (
            <View style={styles.scoreContainer}>
              <Text style={styles.sectionHeader}>Resume Score</Text>
              <View style={styles.overallScoreContainer}>
                <Text style={styles.overallScoreText}>
                  {categoryScores.overall.toFixed(1)}
                </Text>
                <Text style={styles.overallScoreLabel}>/100</Text>
              </View>
              
              <Text style={styles.categoryHeader}>Category Scores</Text>
              
              {/* Format & Layout Score */}
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Format & Layout</Text>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { width: `${categoryScores.format_layout}%` },
                      getScoreColor(categoryScores.format_layout)
                    ]} 
                  />
                </View>
                <Text style={styles.scoreValue}>{categoryScores.format_layout}</Text>
              </View>
              
              {/* Inhalt & Struktur Score */}
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Inhalt & Struktur</Text>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { width: `${categoryScores.inhalt_struktur}%` },
                      getScoreColor(categoryScores.inhalt_struktur)
                    ]} 
                  />
                </View>
                <Text style={styles.scoreValue}>{categoryScores.inhalt_struktur}</Text>
              </View>
              
              {/* Sprache & Stil Score */}
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Sprache & Stil</Text>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { width: `${categoryScores.sprache_stil}%` },
                      getScoreColor(categoryScores.sprache_stil)
                    ]} 
                  />
                </View>
                <Text style={styles.scoreValue}>{categoryScores.sprache_stil}</Text>
              </View>
              
              {/* Ergebnis-Orientierung Score */}
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Ergebnis-Orientierung</Text>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { width: `${categoryScores.ergebnis_orientierung}%` },
                      getScoreColor(categoryScores.ergebnis_orientierung)
                    ]} 
                  />
                </View>
                <Text style={styles.scoreValue}>{categoryScores.ergebnis_orientierung}</Text>
              </View>
            </View>
          )}
          
          {/* Display feedback messages */}
          {activeTab === 'analyse' && (
            <>
              <Text style={styles.sectionHeader}>Detailed Feedback</Text>
              {feedbackMessages.map((msg, index) => (
                <View key={index} style={styles.messageBubble}>
                  <Text style={styles.messageText}>[{msg.section}] {msg.text}</Text>
                </View>
              ))}
            </>
          )}

          {activeTab === 'match' && (
            <>
              <Text style={styles.sectionHeader}>Job Match</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste job description..."
                multiline
                value={jobDescription}
                onChangeText={setJobDescription}
              />
              <TouchableOpacity style={styles.button} onPress={matchWithJob} disabled={loading}>
                <Text style={styles.buttonText}>Match Resume to Job</Text>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'match' && matchResult && (
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
      ) : uploadStarted ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Waiting for results{loadingDots}</Text>
        </View>
      ) : (
        <View style={styles.setupContainer}>
          <Text style={styles.uploadMessage}>Please select a file to upload</Text>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f0fc' },
  container: { flex: 1, paddingVertical: 20, paddingHorizontal: 20, backgroundColor: '#f8f0fc' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 10, marginBottom: 20, color: '#6a5acd' },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#d8bfd8',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#9370db',
  },
  activeTabText: {
    color: '#6a5acd',
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  setupContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadMessage: { fontSize: 18, textAlign: 'center', marginBottom: 40, color: '#6a5acd', maxWidth: '80%', lineHeight: 24 },
  input: { borderWidth: 1, borderColor: '#d8bfd8', borderRadius: 5, padding: 10, marginVertical: 10 },
  button: { backgroundColor: '#9370db', padding: 15, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  uploadButtonContainer: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: Dimensions.get('window').height * 0.7 },
  loadingText: { fontSize: 22, marginBottom: 20, color: '#6a5acd', fontWeight: '500' },
  progressBarContainer: { width: '80%', height: 10, backgroundColor: '#e6e6fa', borderRadius: 5 },
  progressBar: { height: 10, backgroundColor: '#9370db', borderRadius: 5 },
  chatContainer: { flex: 1 },
  messageBubble: { backgroundColor: '#e6e6fa', padding: 10, borderRadius: 5, marginVertical: 5 },
  messageText: { fontSize: 16, color: '#4b0082' },
  sectionHeader: { fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10, color: '#6a5acd' },
  card: { backgroundColor: '#e6e6fa', padding: 12, borderRadius: 5, marginVertical: 10 },
  cardTitle: { fontSize: 18, fontWeight: '500' },
  cardSubtitle: { fontSize: 16, fontWeight: '500', marginTop: 10 },
  cardText: { fontSize: 14, marginVertical: 2 },
  scoreContainer: { padding: 20, backgroundColor: '#f9f9f9', borderRadius: 5, marginVertical: 10 },
  overallScoreContainer: { flexDirection: 'row', alignItems: 'center' },
  overallScoreText: { fontSize: 24, fontWeight: 'bold' },
  overallScoreLabel: { fontSize: 16, marginLeft: 5 },
  categoryHeader: { fontSize: 18, fontWeight: '500', marginTop: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  categoryLabel: { fontSize: 16, flex: 1 },
  scoreBarContainer: { height: 10, width: '60%', backgroundColor: '#ddd', borderRadius: 5, marginRight: 10 },
  scoreBar: { height: 10, borderRadius: 5 },
  scoreBarLow: { backgroundColor: '#ff0000' },
  scoreBarMedium: { backgroundColor: '#ffff00' },
  scoreBarHigh: { backgroundColor: '#00ff00' },
  scoreValue: { fontSize: 16 },
});