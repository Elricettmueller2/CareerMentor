import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "document-text-outline",
  title,
  subtitle,
  iconSize = 64,
  iconColor = "#ccc"
}) => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={iconSize} color={iconColor} />
      <Text style={styles.emptyText}>{title}</Text>
      {subtitle && (
        <Text style={styles.emptySubText}>
          {subtitle}
        </Text>
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
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default EmptyState;
