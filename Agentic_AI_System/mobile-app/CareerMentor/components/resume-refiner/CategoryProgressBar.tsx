import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS } from '@/constants/Colors';

interface CategoryProgressBarProps {
  score: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}

const CategoryProgressBar: React.FC<CategoryProgressBarProps> = ({
  score,
  height = 8,
  backgroundColor = CAREER_COLORS.salt,
  fillColor = CAREER_COLORS.sky,
}) => {
  // Ensure score is between 0 and 100
  const safeScore = Math.min(Math.max(score, 0), 100);
  
  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 90) return CAREER_COLORS.sky;
    if (score >= 75) return CAREER_COLORS.rose;
    if (score >= 60) return CAREER_COLORS.lightRose;
    return CAREER_COLORS.nightSky;
  };
  
  const dynamicFillColor = fillColor === CAREER_COLORS.sky ? getScoreColor(safeScore) : fillColor;
  
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View 
        style={[
          styles.fill, 
          { 
            width: `${safeScore}%`,
            backgroundColor: dynamicFillColor,
            height
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 4,
  },
});

export default CategoryProgressBar;
