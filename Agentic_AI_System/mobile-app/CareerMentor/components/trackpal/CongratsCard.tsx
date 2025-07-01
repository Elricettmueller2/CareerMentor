import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CongratsCardProps {
  message: string;
  style?: ViewStyle;
}

const CongratsCard: React.FC<CongratsCardProps> = ({
  message,
  style
}) => {
  return (
    <LinearGradient
      colors={['#FFD700', '#FFC107']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.container, style]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="trophy" size={40} color="#FFFFFF" />
      </View>
      <Text style={styles.message}>{message}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  }
});

export default CongratsCard;
