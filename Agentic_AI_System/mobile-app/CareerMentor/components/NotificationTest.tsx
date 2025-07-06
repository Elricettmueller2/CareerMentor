import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import NotificationService from '../services/NotificationService';

/**
 * A test component for triggering notifications manually
 * This is useful for testing notification functionality
 */
const NotificationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Check notification permissions
  const checkPermissions = async () => {
    setLoading(true);
    try {
      const status = await Notifications.getPermissionsAsync();
      setPermissionStatus(JSON.stringify(status, null, 2));
      
      Alert.alert(
        'Permission Status',
        `Granted: ${status.granted}\nStatus: ${status.status}\nCan Ask Again: ${status.canAskAgain}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check notification permissions');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to trigger an immediate test notification
  const triggerTestNotification = async () => {
    setLoading(true);
    try {
      // Request permissions first
      const hasPermission = await NotificationService.requestPermissions();
      
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Notification permissions not granted');
        return;
      }
      
      // Schedule an immediate notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from CareerMentor',
          data: { test: true },
        },
        trigger: null,
      });
      
      console.log('Test notification sent with ID:', notificationId);
      Alert.alert('Success', `Test notification sent with ID: ${notificationId}`);
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', `Failed to send test notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to trigger a delayed test notification (10 seconds from now)
  const triggerDelayedNotification = async () => {
    setLoading(true);
    try {
      // Request permissions first
      const hasPermission = await NotificationService.requestPermissions();
      
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Notification permissions not granted');
        return;
      }
      
      // Schedule a notification for 10 seconds from now
      const now = new Date();
      const notificationTime = new Date(now.getTime() + 10000); 
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Delayed Test Notification',
          body: 'This notification was scheduled to arrive 10 seconds after triggering',
          data: { test: true, delayed: true },
        },
        trigger: { type: 'date', date: notificationTime },
      });
      
      console.log('Delayed notification scheduled with ID:', notificationId, 'for time:', notificationTime);
      Alert.alert('Success', `Delayed notification scheduled with ID: ${notificationId}\nExpected at: ${notificationTime.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      Alert.alert('Error', `Failed to schedule delayed notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to check device capabilities
  const checkDeviceCapabilities = () => {
    const isDevice = Device.isDevice;
    const deviceType = Device.deviceType;
    const deviceName = Device.deviceName || 'Unknown';
    const platform = Platform.OS;
    const isSimulator = !isDevice;
    
    const message = `Device Info:\n\nRunning on physical device: ${isDevice}\nDevice type: ${deviceType}\nDevice name: ${deviceName}\nPlatform: ${platform}\nIs simulator/emulator: ${isSimulator}\n\n${isSimulator ? 'NOTE: Notifications may not work properly on simulators/emulators' : ''}`;
    
    Alert.alert('Device Capabilities', message);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5D5B8D" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
      
      <Text style={styles.title}>Notification Testing Tools</Text>
      
      <TouchableOpacity onPress={triggerTestNotification} style={styles.button}>
        <LinearGradient
          colors={['#5D5B8D', '#8089B4']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Send Immediate Notification</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={triggerDelayedNotification} style={styles.button}>
        <LinearGradient
          colors={['#5D5B8D', '#8089B4']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Schedule 10-Second Notification</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={checkPermissions} style={styles.button}>
        <LinearGradient
          colors={['#8089B4', '#5D5B8D']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Check Notification Permissions</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={checkDeviceCapabilities} style={styles.button}>
        <LinearGradient
          colors={['#8089B4', '#5D5B8D']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Check Device Capabilities</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {permissionStatus && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Permission Details:</Text>
          <Text style={styles.infoText}>{permissionStatus}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    color: '#5D5B8D',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f7',
    borderRadius: 8,
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default NotificationTest;
