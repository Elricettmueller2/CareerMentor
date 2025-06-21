import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';

export default function InterviewScreen() {
  const router = useRouter();
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'agent'}>>([]);
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);

  // API base URL - use Docker container hostname when running in Docker
  // Verwende die IP-Adresse statt localhost für den Zugriff von mobilen Geräten
  const API_BASE_URL = 'http://localhost:8000';

  const startInterview = async () => {
    setLoading(true);
    try {
      // Generate a new session ID for each interview
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      
      // Simplest possible fetch request with session ID
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/start_interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            job_role: jobRole,
            experience_level: experienceLevel,
            session_id: newSessionId
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages([{ text: data.response, sender: 'agent' }]);
      setInterviewStarted(true);
    } catch (error) {
      console.error('Error starting interview:', error);
      setMessages([{ text: `Error connecting to interview service: ${error.message}. Make sure the backend API is running.`, sender: 'agent' }]);
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
      // Simplest possible fetch request with session ID
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            user_response: userMessage,
            session_id: sessionId
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: 'agent' }]);
    } catch (error) {
      console.error('Error sending response:', error);
      setMessages(prev => [...prev, { text: `Error connecting to interview service: ${error.message}`, sender: 'agent' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndInterview = () => {
    router.push({ pathname: '/interview-review', params: { sessionId } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mock Interview</Text>
      
      {!interviewStarted ? (
        <View style={styles.setupContainer}>
          <Text style={styles.label}>Job Role:</Text>
          <TextInput
            style={styles.input}
            value={jobRole}
            onChangeText={setJobRole}
            placeholder="e.g. Software Engineer"
          />
          
          <Text style={styles.label}>Experience Level:</Text>
          <TextInput
            style={styles.input}
            value={experienceLevel}
            onChangeText={setExperienceLevel}
            placeholder="e.g. Entry-level, Mid-level, Senior"
          />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={startInterview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Start Interview</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <ScrollView style={styles.messagesContainer}>
            {messages.map((message, index) => (
              <View 
                key={index} 
                style={[
                  styles.messageBubble, 
                  message.sender === 'user' ? styles.userMessage : styles.agentMessage
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2f95dc" />
              </View>
            )}
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type your response..."
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendResponse}
              disabled={loading || !userInput.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleEndInterview}
          >
            <Text style={styles.resetButtonText}>End Interview</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  setupContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2f95dc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    width: '100%',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#2f95dc',
    alignSelf: 'flex-end',
  },
  agentMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2f95dc',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
});
