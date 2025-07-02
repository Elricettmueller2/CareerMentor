import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '../../constants/Colors';

interface StatsCardProps {
  label: string;
  value: number | string;
  showArrow?: boolean;
  isClickable?: boolean;
  onPress?: () => void;
  suffix?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  showArrow = false,
  isClickable = false,
  onPress,
  suffix = '',
}) => {
  const CardComponent = isClickable ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[styles.statCard, isClickable ? styles.clickableCard : null]}
      onPress={isClickable ? onPress : undefined}
      disabled={!isClickable}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueContainer}>
        <Text style={styles.statValue}>
          {value}
          {suffix}
        </Text>
        {showArrow && <Ionicons name="chevron-forward" size={16} color={CAREER_COLORS.white} />}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  statCard: {
    backgroundColor: CAREER_COLORS.nightSky,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  clickableCard: {
    borderColor: CAREER_COLORS.nightSky,
    borderWidth: 1,
    shadowColor: CAREER_COLORS.nightSky,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    color: CAREER_COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: CAREER_COLORS.white,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
});

export default StatsCard;
