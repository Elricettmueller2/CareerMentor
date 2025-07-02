import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle, ColorValue, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CAREER_COLORS } from '../../constants/Colors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  icon?: React.ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  loadingText,
  style,
  textStyle,
  small = false,
  colors = [CAREER_COLORS.rose, CAREER_COLORS.sky] as readonly [ColorValue, ColorValue],
  icon,
}) => {
  // Apply opacity to button when disabled
  const buttonOpacity = disabled ? 0.6 : 1;
  
  return (
    <TouchableOpacity
      style={[styles.button, small ? styles.smallButton : {}, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        style={[styles.gradient, { opacity: buttonOpacity }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" size={small ? "small" : "small"} />
            {loadingText && (
              <Text style={[styles.text, styles.loadingText, small ? styles.smallText : {}, textStyle]}>
                {loadingText}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.text, small ? styles.smallText : {}, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    borderRadius: 25, // More rounded corners
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  smallButton: {
    height: 40,
    minWidth: 80,
    borderRadius: 20,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 25, // Match button borderRadius
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  }
});

export default GradientButton;
