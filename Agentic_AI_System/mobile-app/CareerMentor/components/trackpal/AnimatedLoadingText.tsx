import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { CAREER_COLORS } from '@/constants/Colors';

type LoadingType = 'jobs' | 'insights' | 'default';

interface AnimatedLoadingTextProps {
  style?: object;
  type?: LoadingType;
}

const AnimatedLoadingText: React.FC<AnimatedLoadingTextProps> = ({ style, type = 'default' }) => {
  const [dots, setDots] = useState('...');
  // Initialize with a random message index
  const [messageIndex, setMessageIndex] = useState(() => {
    // This will run only once when the component mounts
    return Math.floor(Math.random() * 
      (type === 'jobs' ? 6 : 
       type === 'insights' ? 6 : 4));
  });
  
  // Job-related loading messages
  const jobLoadingMessages = [
    'Loading your jobs',
    'Syncing your job progress',
    'Refreshing your opportunities',
    'Scanning for updates',
    'Fetching your job data',
    'One sec, getting everything ready',
  ];
  
  // AI Insights-related loading messages
  const insightsLoadingMessages = [
    'Analyzing your applications',
    'Generating AI insights',
    'Finding patterns in your data',
    'Preparing personalized advice',
    'Creating strategic recommendations',
    'Identifying application trends',
  ];
  
  // Default generic loading messages
  const defaultLoadingMessages = [
    'Loading',
    'Please wait',
    'Getting data',
    'Preparing content',
  ];
  
  // Select the appropriate message set based on type
  const loadingMessages = 
    type === 'jobs' ? jobLoadingMessages :
    type === 'insights' ? insightsLoadingMessages :
    defaultLoadingMessages;

  // Animate the dots
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '...';
      });
    }, 400); // Change dots every 400ms
    
    return () => clearInterval(dotsInterval);
  }, []);

  // Cycle through messages every 5 seconds
  useEffect(() => {
    const messageInterval = setInterval(() => {
      // Get the correct message array length based on type
      const messagesLength = 
        type === 'jobs' ? jobLoadingMessages.length : 
        type === 'insights' ? insightsLoadingMessages.length : 
        defaultLoadingMessages.length;
      
      // Move to the next message in sequence
      setMessageIndex(prevIndex => (prevIndex + 1) % messagesLength);
    }, 5000);
    
    return () => clearInterval(messageInterval);
  }, [type]);

  return (
    <Text style={[styles.loadingText, style]}>
      {loadingMessages[messageIndex]}{dots}
    </Text>
  );
};

const styles = StyleSheet.create({
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: CAREER_COLORS.nightSky,
    marginVertical: 10,
  },
});

export default AnimatedLoadingText;
