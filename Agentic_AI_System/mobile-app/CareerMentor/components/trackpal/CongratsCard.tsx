import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CAREER_COLORS } from '../../constants/Colors';

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
        colors={[CAREER_COLORS.green, '#4CAF50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, style]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.iconBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trophy" size={48} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
});

export default CongratsCard;
