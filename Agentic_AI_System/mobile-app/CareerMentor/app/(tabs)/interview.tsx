import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

const API_BASE_URL = 'http://localhost:8000';

export default function InterviewScreen() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'agent'}>>([]);
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);

  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const startInterview = async () => {
    setLoading(true);
    try {
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/start_interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { job_role: jobRole, experience_level: experienceLevel, session_id: newSessionId } }),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      setMessages([{ text: data.response, sender: 'agent' }]);
      setInterviewStarted(true);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      setMessages([{ text: `Error connecting to interview service: ${error.message}. Make sure the backend is running.`, sender: 'agent' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!userInput.trim()) return;
    
    const userMessage = userInput.trim();
    setMessages([...messages, { text: userMessage, sender: 'user' }]);
    setUserInput('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { user_response: userMessage, session_id: sessionId } }),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: 'agent' }]);
    } catch (error: any) { 
      console.error('Error sending response:', error);
      setMessages(prev => [...prev, { text: `Error connecting to interview service: ${error.message}`, sender: 'agent' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = () => {
    router.push({ pathname: '/interview-review', params: { sessionId } });
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#8D85E6" />;
  }

  return (
    <LinearGradient colors={['#F7F7F7', '#E3E4E6']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Mock Interview</Text>
        
        {!interviewStarted ? (
          <View style={styles.setupContainer}>
            <Text style={styles.label}>Job Role:</Text>
            <TextInput
              style={styles.input}
              value={jobRole}
              onChangeText={setJobRole}
              placeholder="e.g. Software Engineer"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Experience Level:</Text>
            <TextInput
              style={styles.input}
              value={experienceLevel}
              onChangeText={setExperienceLevel}
              placeholder="e.g. Entry-level, Mid-level, Senior"
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity style={styles.button} onPress={startInterview} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Interview</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chatContainer}>
            <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingBottom: 20 }}>
              {messages.map((message, index) => (
                <View key={index} style={[styles.messageBubble, message.sender === 'user' ? styles.userMessage : styles.agentMessage]}>
                  <Text style={message.sender === 'user' ? styles.userMessageText : styles.agentMessageText}>{message.text}</Text>
                </View>
              ))}
              {loading && <ActivityIndicator size="small" color="#8D85E6" style={{ marginTop: 10 }} />}
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.chatInput}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Type your response..."
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendResponse} disabled={loading || !userInput.trim()}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.resetButton} onPress={handleEndInterview}>
              <Text style={styles.resetButtonText}>End Interview</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Manrope_600SemiBold',
    color: '#5A5D83',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    borderWidth: 1,
    borderColor: '#E3E4E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: '#8D85E6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8D85E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#8D85E6',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  userMessageText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Manrope_400Regular',
  },
  agentMessageText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Manrope_400Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    color: '#333',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#8D85E6',
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
});
