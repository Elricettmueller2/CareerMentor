import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { CAREER_COLORS } from '@/constants/Colors';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  textSize?: number;
  textColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  textSize = 20,
  textColor = CAREER_COLORS.midnight,
  progressColor = CAREER_COLORS.rose,
  backgroundColor = CAREER_COLORS.salt,
}) => {
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${center}, ${center})`}
        />
        
        {/* Percentage Text */}
        <SvgText
          x={center}
          y={center + textSize / 3}
          fontSize={textSize}
          fontWeight="bold"
          fill={textColor}
          textAnchor="middle"
        >
          {`${Math.round(percentage)}%`}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularProgress;
