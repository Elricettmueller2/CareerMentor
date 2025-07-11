import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CAREER_COLORS } from '../../constants/Colors';

interface SmartActionCardProps {
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
}

const SmartActionCard: React.FC<SmartActionCardProps> = ({
  title,
  description,
  iconName,
  onPress,
  style
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={iconName} size={24} color="#fff" />
        </LinearGradient>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={CAREER_COLORS.white} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: CAREER_COLORS.nightSky,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: CAREER_COLORS.white,
  },
  description: {
    fontSize: 14,
    color: CAREER_COLORS.salt,
  }
});

export default SmartActionCard;
