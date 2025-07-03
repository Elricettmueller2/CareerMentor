import React from 'react';
import { Alert, Linking, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '../../constants/Colors';
import GradientButton from './GradientButton';

interface JobLinkButtonProps {
  url?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const JobLinkButton: React.FC<JobLinkButtonProps> = ({ url, onPress, style }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
    } else {
      Alert.alert('No Link Available', 'This job posting does not have a link yet.');
    }
  };

  return (
    <GradientButton
      title="View Job Posting"
      onPress={handlePress}
      style={[{ width: 200, marginVertical: 20 }, style]}
      icon={<Ionicons name="open-outline" size={20} color={CAREER_COLORS.white} />}
      colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
    />
  );
};

export default JobLinkButton;
