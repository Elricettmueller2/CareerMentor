import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, Tabs } from 'expo-router';
import { Pressable, View, Text, StyleSheet } from 'react-native';

import Colors, { CAREER_COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// Custom tab bar icon with pill background when active
function CustomTabBarIcon({ isFocused, icon, label, color }: { isFocused: boolean; icon: React.ReactNode; label: string; color: string }) {
  return (
    <View style={tabStyles.tabContainer}>
      <View style={[tabStyles.iconContainer, isFocused && tabStyles.activeIconContainer]}>
        {icon}
      </View>
      <Text style={[tabStyles.tabLabel, isFocused && tabStyles.activeTabLabel, { color }]}>
        {label}
      </Text>
    </View>
  );
}

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 28} {...props} />;
}

function IonIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return <Ionicons size={props.size || 28} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: CAREER_COLORS.white,
        tabBarStyle: { 
          backgroundColor: CAREER_COLORS.nightSky,
          paddingTop: 16,
          height: 90,
          borderTopWidth: 0,
          shadowColor: CAREER_COLORS.midnight,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 10, // for Android
        },
        tabBarInactiveTintColor: CAREER_COLORS.salt,
        tabBarLabelStyle: {
          fontSize: 1,
          fontWeight: '500',
          paddingBottom: 5,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        tabBarLabel: ({ focused, color }) => null, // Hide default label, we'll use our custom one
        tabBarIcon: ({ focused, color }) => {
          let iconComponent;
          let label = '';
          
          if (route.name === 'trackpal') {
            label = 'TrackPal';
            iconComponent = <MaterialIcons name="insights" color={color} size={24} />;
          } else if (route.name === 'pathfinder') {
            label = 'PathFinder';
            iconComponent = <Ionicons name="compass" color={color} size={24} />;
          } else if (route.name === 'resume-refiner') {
            label = 'ResumeRefiner';
            iconComponent = <FontAwesome name="file-text" color={color} size={20} />;
          } else if (route.name === 'interview') {
            label = 'MockMate';
            iconComponent = <Ionicons name="chatbubbles" color={color} size={24} />;
          }
          
          return <CustomTabBarIcon isFocused={focused} icon={iconComponent} label={label} color={color} />;
        },
      })}>
      <Tabs.Screen
        name="trackpal"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="pathfinder"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="resume-refiner"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="interview"
        options={{
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

// Tab bar styles
const tabStyles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 64,
    borderRadius: 24,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
    textAlign: 'center',
    width: '100%',
  },
  activeTabLabel: {
    fontWeight: '700',
  },
});
