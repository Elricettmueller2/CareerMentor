import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  size?: number;
}) {
  return <FontAwesome size={props.size || 28} style={{ marginBottom: -3 }} {...props} />;
}

function IonIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return <Ionicons size={props.size || 28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors['light'].tint,
        tabBarStyle: { backgroundColor: '#ffffff' },
        tabBarInactiveTintColor: '#999999',
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="trackpal"
        options={{
          title: 'TrackPal',
          tabBarIcon: ({ color }) => <MaterialIcons name="insights" color={color} size={28}/>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="pathfinder"
        options={{
          title: 'Path Finder',
          tabBarIcon: ({ color }) => <IonIcon name="compass" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="interview"
        options={{
          title: 'Interview',
          tabBarIcon: ({ color }) => <IonIcon name="chatbubbles" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="resume-refiner"
        options={{
          title: 'ResumeRefiner',
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} size={20} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
