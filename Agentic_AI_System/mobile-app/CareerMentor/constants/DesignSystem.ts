/**
 * CareerMentor Design System
 * 
 * This file contains the core design tokens and variables used throughout the app.
 * Always reference these values instead of hardcoding colors, spacing, etc.
 */

// Color Palette
export const colors = {
  // Primary Colors
  primary: {
    main: '#8D85E6',  // Purple - Main brand color
    light: '#B3ADEE',
    dark: '#6A62C2',
    contrast: '#FFFFFF',
  },
  
  // Secondary Colors
  secondary: {
    main: '#4ECDC4',  // Teal - Secondary brand color
    light: '#7FDAD4',
    dark: '#3AA39B',
    contrast: '#FFFFFF',
  },
  
  // Accent Colors
  accent: {
    success: '#2ECC71',  // Green
    warning: '#F39C12',  // Orange
    error: '#FF6B6B',    // Red
    info: '#3498DB',     // Blue
  },
  
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    background: '#F7F7F7',
    backgroundAlt: '#E3E4E6',
    grey100: '#F9F9F9',
    grey200: '#E3E4E6',
    grey300: '#D1D3D8',
    grey400: '#A9ABB8',
    grey500: '#8A8D9F',
    grey600: '#5A5D83',
    grey700: '#444564',
    grey800: '#333353',
    grey900: '#1E1E2F',
    black: '#000000',
  },
  
  // Gradient Presets
  gradients: {
    primary: ['#8D85E6', '#6A62C2'],
    secondary: ['#4ECDC4', '#3AA39B'],
    background: ['#F7F7F7', '#E3E4E6'],
    card: ['#FFFFFF', '#F9F9F9'],
  },
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semiBold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  primary: {
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
};

// Animation Durations
export const animation = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Z-Index
export const zIndex = {
  base: 0,
  above: 1,
  dropdown: 10,
  modal: 100,
  toast: 1000,
};

// Screen Sizes
export const screenSizes = {
  xs: 320,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
};
