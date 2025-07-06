import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Platform,
  TouchableOpacity
} from 'react-native';
import { CAREER_COLORS } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface CareerDaddyHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

const CareerDaddyHeader: React.FC<CareerDaddyHeaderProps> = ({
  title = 'Career Daddy',
  showBackButton = false,
  onBackPress,
  rightComponent
}) => {
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={CAREER_COLORS.white} />
          </TouchableOpacity>
        )}
        
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain" 
        />
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        {rightComponent && (
          <View style={styles.rightComponentContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: CAREER_COLORS.nightSky,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
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
    color: CAREER_COLORS.white,
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  rightComponentContainer: {
    marginLeft: 'auto',
  }
});

export default CareerDaddyHeader;
