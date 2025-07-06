import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from './GradientButton';
import { CAREER_COLORS } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconColor?: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  iconSize = 48,
  iconColor = CAREER_COLORS.white,
  buttonText,
  onButtonPress
}) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="briefcase" size={iconSize} color={iconColor} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyText}>{title}</Text>
      {subtitle && (
        <Text style={styles.emptySubText}>
          {subtitle}
        </Text>
      )}
      {buttonText && onButtonPress && (
        <View style={styles.buttonContainer}>
          <GradientButton
            title={buttonText}
            onPress={onButtonPress}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: CAREER_COLORS.nightSky,
  },
  emptySubText: {
    fontSize: 14,
    color: CAREER_COLORS.midnight,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
    width: '80%',
  }
});

export default EmptyState;
