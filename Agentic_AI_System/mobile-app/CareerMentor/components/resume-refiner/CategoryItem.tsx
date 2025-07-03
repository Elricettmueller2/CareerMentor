import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';
import CategoryProgressBar from './CategoryProgressBar';
import { LinearGradient } from 'expo-linear-gradient';

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
    if (score >= 75) return CAREER_COLORS.green;  // Good score - green
    if (score >= 50) return CAREER_COLORS.yellow;        // Medium score - yellow
    return CAREER_COLORS.red;                     // Poor score - red
  };

  return (
    <View style={[
      styles.container, 
      expanded && styles.expandedContainer,
    ]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name={icon as any} size={20} color={CAREER_COLORS.white} />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>
            {score}%
          </Text>
          {onPress && (
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={CAREER_COLORS.white} 
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
    backgroundColor: CAREER_COLORS.nightSky,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  expandedContainer: {
    borderWidth: 0,
    borderColor: CAREER_COLORS.nightSky,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: CAREER_COLORS.white,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    color: CAREER_COLORS.white,
  },
  chevron: {
    marginLeft: 0,
    marginRight: 4,
    color: CAREER_COLORS.white,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
    backgroundColor: CAREER_COLORS.nightSky,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});

export default CategoryItem;
