import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CAREER_COLORS } from '../../constants/Colors';

interface InsightCardProps {
  id: string;
  icon: string;
  content: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ id, icon, content }) => {
  return (
    <View key={id} style={styles.insightCard}>
      <LinearGradient
        colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
        style={styles.insightIconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name={icon as any} size={24} color="#fff" />
      </LinearGradient>
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
    backgroundColor: CAREER_COLORS.nightSky,
  },
  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
