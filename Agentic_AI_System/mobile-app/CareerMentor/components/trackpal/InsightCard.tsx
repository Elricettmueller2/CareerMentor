import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InsightCardProps {
  id: string;
  icon: string;
  content: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ id, icon, content }) => {
  return (
    <View key={id} style={styles.insightCard}>
      <View style={styles.insightIconCircle}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.insightText}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  insightCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#5D5B8D',
  },
  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#fff',
  },
});

export default InsightCard;
