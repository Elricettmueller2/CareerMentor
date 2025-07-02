import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabNavigationProps {
  activeTab: 'dashboard' | 'ai';
  onTabChange: (tab: 'dashboard' | 'ai') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => onTabChange('dashboard')}
      >
        <Ionicons 
          name="list-outline" 
          size={20} 
          color={activeTab === 'dashboard' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
        onPress={() => onTabChange('ai')}
      >
        <Ionicons 
          name="bulb-outline" 
          size={20} 
          color={activeTab === 'ai' ? '#000' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>Testing</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
});

export default TabNavigation;
