import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  View as RNView,
  TouchableOpacity
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Import custom components
import InterviewHeader from '@/components/interview/InterviewHeader';
import InterviewSetupForm, { InterviewSetupData } from '@/components/interview/InterviewSetupForm';
import MessageBubble from '@/components/interview/MessageBubble';
import ChatInput from '@/components/interview/ChatInput';
import InterviewProgress from '@/components/interview/InterviewProgress';

const API_BASE_URL = 'http://localhost:8000';

interface Message {
  text: string;
  sender: 'user' | 'agent';
  timestamp?: string;
}

export default function InterviewScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State variables
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [interviewType, setInterviewType] = useState<'Technical' | 'Behavioral'>('Technical');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5); // Default value, will be updated from API
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(15); // Default 15 minutes

  // Load fonts
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Update time remaining periodically
  useEffect(() => {
    if (interviewStarted && estimatedTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
      }, 60000); // Update every minute
      
      return () => clearTimeout(timer);
    }
  }, [interviewStarted, estimatedTimeRemaining]);

  // Start interview with form data
  const startInterview = async (formData: InterviewSetupData) => {
    setLoading(true);
    try {
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      setInterviewType(formData.interviewType);
      
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/start_interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            job_title: formData.jobTitle, 
            experience_level: formData.experienceLevel,
            interview_type: formData.interviewType,
            company_culture: formData.companyCulture,
            session_id: newSessionId 
          } 
        }),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Try to parse the JSON response if it's a string
      let parsedResponse;
      try {
        parsedResponse = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
        
        // If we have metadata about the interview, update our state
        if (parsedResponse.total_questions) {
          setTotalQuestions(parsedResponse.total_questions);
        }
        
        if (parsedResponse.estimated_duration_minutes) {
          setEstimatedTimeRemaining(parsedResponse.estimated_duration_minutes);
        }
        
      } catch (e) {
        parsedResponse = { introduction: data.response };
      }
      
      // Extract the introduction text
      const introText = parsedResponse.introduction || data.response;
      
      setMessages([{ 
        text: introText, 
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString() 
      }]);
      
      setInterviewStarted(true);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      setMessages([{ 
        text: `Error connecting to interview service: ${error.message}. Make sure the backend is running.`, 
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Send user response
  const sendResponse = async (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      text: message, 
      sender: 'user',
      timestamp 
    }]);
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/agents/mock_mate/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            user_response: message, 
            session_id: sessionId,
            interview_type: interviewType
          } 
        }),
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Try to parse the JSON response if it's a string
      let parsedResponse;
      try {
        parsedResponse = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
        
        // If we have question number information, update our state
        if (parsedResponse.question_number) {
          setCurrentQuestion(parsedResponse.question_number);
        } else {
          // If no specific question number, just increment
          setCurrentQuestion(prev => Math.min(prev + 1, totalQuestions));
        }
        
        // Extract the agent response text
        const responseText = parsedResponse.response || data.response;
        
        setMessages(prev => [...prev, { 
          text: responseText, 
          sender: 'agent',
          timestamp: new Date().toLocaleTimeString() 
        }]);
      } catch (e) {
        // If parsing fails, just use the raw response
        setMessages(prev => [...prev, { 
          text: data.response, 
          sender: 'agent',
          timestamp: new Date().toLocaleTimeString() 
        }]);
        
        // Increment question counter
        setCurrentQuestion(prev => Math.min(prev + 1, totalQuestions));
      }
    } catch (error: any) {
      console.error('Error sending response:', error);
      setMessages(prev => [...prev, { 
        text: `Error connecting to interview service: ${error.message}`, 
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // End interview and go to review
  const handleEndInterview = () => {
    router.push({ 
      pathname: '/interview-review', 
      params: { 
        sessionId,
        interviewType 
      } 
    });
  };

  // Loading state
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.sky} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <InterviewHeader 
        title="Mock Interview" 
        subtitle={interviewStarted ? `${interviewType} Interview` : "Setup your interview"}
        interviewType={interviewStarted ? interviewType : undefined}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        {!interviewStarted ? (
          // Interview Setup Screen
          <View style={styles.setupContainer}>
            <InterviewSetupForm 
              onStartInterview={startInterview}
              loading={loading}
            />
          </View>
        ) : (
          // Interview Chat Screen
          <View style={styles.chatContainer}>
            {/* Progress indicator */}
            <InterviewProgress 
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              estimatedTimeRemaining={estimatedTimeRemaining}
            />
            
            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer} 
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message.text}
                  isUser={message.sender === 'user'}
                  timestamp={message.timestamp}
                />
              ))}
              
              {loading && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color={COLORS.sky} />
                </View>
              )}
            </ScrollView>
            
            {/* Chat input */}
            <ChatInput 
              onSend={sendResponse}
              disabled={loading}
              loading={loading}
            />
            
            {/* End interview button */}
            <TouchableOpacity 
              style={styles.endButton}
              onPress={handleEndInterview}
            >
              <Ionicons name="flag" size={18} color={COLORS.white} />
              <Text style={styles.endButtonText}>End Interview</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  setupContainer: {
    flex: 1,
    padding: 20,
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingIndicator: {
    padding: 10,
    alignItems: 'center',
  },
  endButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.rose,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});