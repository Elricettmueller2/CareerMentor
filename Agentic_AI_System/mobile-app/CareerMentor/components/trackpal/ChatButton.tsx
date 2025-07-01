import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ChatButtonProps {
  onPress: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.chatFab}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#5D5B8D', '#4a6da7']}
        style={styles.chatFabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 85,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 30,
    zIndex: 999,
  },
  chatFabGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default ChatButton;
