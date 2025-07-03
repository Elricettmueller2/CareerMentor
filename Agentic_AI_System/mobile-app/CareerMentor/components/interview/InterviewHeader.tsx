import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InterviewHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  interviewType?: 'Technical' | 'Behavioral';
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  title,
  subtitle,
  onBackPress,
  showBackButton = false,
  interviewType
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.nightSky} barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.nightSky, COLORS.nightSky]}
        style={[styles.header]}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
          {showBackButton && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          
          {interviewType && (
            <View style={[
              styles.badge,
              interviewType === 'Technical' ? styles.technicalBadge : styles.behavioralBadge
            ]}>
              <Text style={styles.badgeText}>{interviewType}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.salt,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicalBadge: {
    backgroundColor: COLORS.sky,
  },
  behavioralBadge: {
    backgroundColor: COLORS.rose,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default InterviewHeader;
