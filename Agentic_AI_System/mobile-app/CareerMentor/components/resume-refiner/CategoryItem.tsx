import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';
import CategoryProgressBar from './CategoryProgressBar';

interface CategoryItemProps {
  title: string;
  score: number;
  icon?: string;
  expanded?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  title,
  score,
  icon = 'checkmark-circle',
  expanded = false,
  onPress,
  children,
}) => {
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 90) return CAREER_COLORS.sky;
    if (score >= 75) return CAREER_COLORS.rose;
    if (score >= 60) return CAREER_COLORS.lightRose;
    return CAREER_COLORS.nightSky;
  };

  return (
    <View style={[styles.container, expanded && styles.expandedContainer]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.titleContainer}>
          <Ionicons name={icon as any} size={24} color={getScoreColor(score)} style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getScoreColor(score) }]}>
            {score}%
          </Text>
          {onPress && (
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={CAREER_COLORS.midnight} 
              style={styles.chevron}
            />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Add progress bar below the header */}
      <View style={styles.progressBarContainer}>
        <CategoryProgressBar score={score} fillColor={getScoreColor(score)} />
      </View>
      
      {expanded && children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CAREER_COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  expandedContainer: {
    borderWidth: 2,
    borderColor: CAREER_COLORS.nightSky,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: CAREER_COLORS.midnight,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  progressBarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 16,
    backgroundColor: CAREER_COLORS.salt,
  },
});

export default CategoryItem;
