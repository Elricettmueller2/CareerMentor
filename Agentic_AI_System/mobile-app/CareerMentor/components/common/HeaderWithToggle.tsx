import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { CAREER_COLORS as COLORS } from '@/constants/Colors';

interface ToggleOption {
  id: string;
  label: string;
}

interface HeaderWithToggleProps {
  title?: string;
  options: ToggleOption[];
  activeOptionId: string;
  onOptionChange: (optionId: string) => void;
  logoSource?: any;
}

const HeaderWithToggle: React.FC<HeaderWithToggleProps> = ({
  title = 'Career Daddy',
  options,
  activeOptionId,
  onOptionChange,
  logoSource = require('@/assets/images/logo.png')
}) => {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={logoSource} 
            style={styles.logo}
            resizeMode="contain" 
          />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.tabContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.tab,
              activeOptionId === option.id && styles.activeTab
            ]}
            onPress={() => onOptionChange(option.id)}
          >
            <Text 
              style={[
                styles.tabText, 
                activeOptionId === option.id && styles.activeTabText
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.nightSky,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  logo: {
    width: 30,
    height: 36, 
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 0, 
    marginTop: 0, 
    marginLeft: 0,
    textAlign: 'left',
    alignSelf: 'center', 
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 87,
    borderRadius: 25,
    backgroundColor: COLORS.salt,
    padding: 3,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 0,
  },
  activeTab: {
    backgroundColor: COLORS.nightSky,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.nightSky,
  },
  activeTabText: {
    color: COLORS.white,
  },
});

export default HeaderWithToggle;
