import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';

interface InfoCardProps {
  title: string;
  message: string;
  iconName: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  iconColor?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  message,
  iconName,
  style,
  iconColor = '#5D5B8D'
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  }
});

export default InfoCard;
