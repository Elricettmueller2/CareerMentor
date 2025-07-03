import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { CAREER_COLORS } from '../../constants/Colors';

export interface TabItem {
  id: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabSwitcher: React.FC<TabSwitcherProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id ? styles.activeTab : {}]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === tab.id ? styles.activeTabText : {}
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 25,
    backgroundColor: CAREER_COLORS.salt,
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
    backgroundColor: CAREER_COLORS.nightSky,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: CAREER_COLORS.nightSky,
  },
  activeTabText: {
    color: CAREER_COLORS.white,
  },
});

export default TabSwitcher;
