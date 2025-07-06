import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  View,
  TouchableOpacity
} from 'react-native';
import { Text } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '@/components/trackpal/GradientButton';
import { spacing } from '@/constants/DesignSystem';

import CareerDaddyHeader from '@/components/common/CareerDaddyHeader';
import InterviewSetupForm from '@/components/interview/InterviewSetupForm';
import MessageBubble from '@/components/interview/MessageBubble';
import EnhancedMessageBubble from '@/components/interview/EnhancedMessageBubble';
import ChatInput from '@/components/interview/ChatInput';
import InterviewProgress from '@/components/interview/InterviewProgress';

import { InterviewMessage, InterviewSetupData } from '@/types/interview';

import { API_BASE_URL } from '../../constants/ApiEndpoints';

interface ParsedInterviewResponse {
  introduction?: string;
  response?: string;
  total_questions?: number;
  estimated_duration_minutes?: number;
  evaluation?: string;
  follow_up?: string;
  notes?: string;
  question_number?: number;
}

export default function InterviewScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [interviewType, setInterviewType] = useState<'Technical' | 'Behavioral'>('Technical');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5); 
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(15); 

  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (interviewStarted && estimatedTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
      }, 60000); 
      
      return () => clearTimeout(timer);
    }
  }, [interviewStarted, estimatedTimeRemaining]);

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
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      let parsedResponse: ParsedInterviewResponse;
      try {
        parsedResponse = typeof data.response === 'string'
          ? JSON.parse(data.response)
          : data.response;
        
        if (parsedResponse.total_questions) {
          setTotalQuestions(parsedResponse.total_questions);
        }
        
        if (parsedResponse.estimated_duration_minutes) {
          setEstimatedTimeRemaining(parsedResponse.estimated_duration_minutes);
        }
        
        if (parsedResponse.evaluation) {
          setMessages([{ 
            evaluation: parsedResponse.evaluation,
            notes: parsedResponse.notes,
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString() 
          }]);
          
          if (parsedResponse.follow_up) {
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                text: parsedResponse.follow_up,
                sender: 'agent',
                isFollowUp: true,
                timestamp: new Date().toLocaleTimeString() 
              }]);
            }, 500);
          }
        } else {
          const introText = parsedResponse.introduction || parsedResponse.response || data.response;
          
          setMessages([{ 
            text: introText, 
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString() 
          }]);
        }
      } catch (e) {
        setMessages([{ 
          text: data.response, 
          sender: 'agent',
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }
      
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

  const sendResponse = async (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    
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
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      let parsedResponse: ParsedInterviewResponse;
      try {
        parsedResponse = 
          typeof data.response === 'string' 
            ? JSON.parse(data.response) 
            : data.response;
        
        if (parsedResponse.question_number) {
          setCurrentQuestion(parsedResponse.question_number);
        } else {
          setCurrentQuestion(prev => Math.min(prev + 1, totalQuestions));
        }
        
        if (parsedResponse.evaluation) {
          setMessages(prev => [...prev, { 
            evaluation: parsedResponse.evaluation,
            notes: parsedResponse.notes,
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString() 
          }]);
          
          if (parsedResponse.follow_up) {
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                text: parsedResponse.follow_up,
                sender: 'agent',
                isFollowUp: true,
                timestamp: new Date().toLocaleTimeString() 
              }]);
            }, 500);
          }
        } else {
          // Extract the agent response text
          const responseText = parsedResponse.response || data.response;
          
          setMessages(prev => [...prev, { 
            text: responseText, 
            sender: 'agent',
            timestamp: new Date().toLocaleTimeString() 
          }]);
        }
      } catch (e) {
        setMessages(prev => [...prev, { 
          text: data.response, 
          sender: 'agent',
          timestamp: new Date().toLocaleTimeString() 
        }]);
        
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
    <View style={styles.container}>
      <CareerDaddyHeader 
        title="CareerDaddy" 
        showBackButton={interviewStarted}
        onBackPress={handleEndInterview}
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
              {messages.map((message, index) => {
                if (message.sender === 'user') {
                  // User message
                  return (
                    <MessageBubble
                      key={index}
                      message={message.text || ''}
                      isUser={true}
                      timestamp={message.timestamp}
                    />
                  );
                } else if (message.evaluation) {
                  // Structured evaluation message
                  return (
                    <EnhancedMessageBubble
                      key={index}
                      message={{
                        evaluation: message.evaluation,
                        notes: message.notes
                      }}
                      isUser={false}
                      timestamp={message.timestamp}
                    />
                  );
                } else {
                  // Regular agent message or follow-up question
                  return (
                    <MessageBubble
                      key={index}
                      message={message.text || ''}
                      isUser={false}
                      isFollowUp={message.isFollowUp}
                      timestamp={message.timestamp}
                    />
                  );
                }
              })}
              
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
            <GradientButton
              title="End Interview"
              onPress={handleEndInterview}
              colors={[COLORS.rose, COLORS.sky]}
              style={{ margin: spacing.md }}
              icon={<Ionicons name="flag" size={18} color={COLORS.white} />}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  setupContainer: {
    flex: 1,
    padding: Platform.OS === 'ios' ? 16 : 20,
    backgroundColor: COLORS.white,
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
});