import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS } from '@/constants/Colors';

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }, style]}>
      <Text style={styles.statusText}>{formatStatusText(status)}</Text>
    </View>
  );
};

// Format status text for display
export const formatStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'saved':
      return 'Saved';
    case 'applied':
      return 'Applied';
    case 'interview':
      return 'Interview';
    case 'offer':
      return 'Offer';
    case 'rejected':
      return 'Rejected';
    case 'accepted':
      return 'Accepted';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
};

// Get color based on status
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'saved':
      return CAREER_COLORS.nightSky;
    case 'applied':
      return CAREER_COLORS.nightSky;
    case 'interview':
      return CAREER_COLORS.nightSky;
    case 'offer':
      return CAREER_COLORS.nightSky;
    case 'rejected':
      return CAREER_COLORS.red;
    case 'accepted':
      return CAREER_COLORS.green;
    case 'declined':
      return CAREER_COLORS.nightSky;
    default:
      return CAREER_COLORS.nightSky;
  }
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
