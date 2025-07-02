import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '../../constants/Colors';

interface JobLinkButtonProps {
  url?: string;
  onPress?: () => void;
}

const JobLinkButton: React.FC<JobLinkButtonProps> = ({ url, onPress }) => {
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
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
    >
      <LinearGradient
        colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
        style={styles.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.buttonText}>View Job Posting</Text>
        <Ionicons name="open-outline" size={20} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 50,
    borderRadius: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default JobLinkButton;
