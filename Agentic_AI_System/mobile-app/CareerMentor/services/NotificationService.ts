import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_status';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep for backward compatibility
    shouldShowBanner: true, // New recommended property
    shouldShowList: true,   // New recommended property
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface FollowUpNotification {
  id: string;
  applicationId: string;
  company: string;
  position: string;
  followUpDate: Date;
  notificationId?: string;
}

const NotificationService = {
  // Request permission for notifications
  requestPermissions: async (): Promise<boolean> => {
    if (!Device.isDevice) {
      console.log('Notifications not available on simulator/emulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions');
      return false;
    }

    // Save permission status
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    return true;
  },

  // Check if notifications are permitted
  checkPermissions: async (): Promise<boolean> => {
    if (!Device.isDevice) return false;

    const savedStatus = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    if (savedStatus === 'granted') return true;

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  // Schedule a follow-up reminder notification
  scheduleFollowUpReminder: async (
    applicationId: string,
    company: string,
    position: string,
    followUpDate: Date
  ): Promise<string | null> => {
    try {
      console.log(`Scheduling notification for application ${applicationId} at ${company}`);
      
      // Request permissions if needed
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }
      
      // First, cancel ALL existing notifications for this application
      try {
        // Cancel any stored notifications in our AsyncStorage
        const existingNotifications = await NotificationService.getApplicationNotifications(applicationId);
        for (const notification of existingNotifications) {
          if (notification.notificationId) {
            try {
              await Notifications.cancelScheduledNotificationAsync(notification.notificationId);
              console.log(`Canceled notification ${notification.notificationId} for application ${applicationId}`);
            } catch (e) {
              console.log(`Failed to cancel notification ${notification.notificationId}:`, e);
            }
          }
        }
        
        // Remove all notifications for this application from storage
        await NotificationService.removeNotificationsForApplication(applicationId);
      } catch (error) {
        console.error('Error while canceling existing notifications:', error);
        // Continue with scheduling even if cancellation fails
      }

      // Set notification to trigger exactly on the follow-up date
      let notificationDate = new Date(followUpDate);
      
      // Always add a minimum buffer to the notification time to account for delays
      // and time picker precision issues
      const nowMs = new Date().getTime();
      const minimumBufferMs = 60000; // 1 minute minimum buffer
      
      // If the notification time is less than the minimum buffer in the future,
      // automatically adjust it forward
      if (notificationDate.getTime() < nowMs + minimumBufferMs) {
        // Set notification time to be at least the minimum buffer in the future
        notificationDate = new Date(nowMs + minimumBufferMs);
        console.log(
          'Notification time adjusted to be at least 1 minute in the future:',
          notificationDate.toISOString(),
          '(Original time was too close to current time:',
          new Date().toISOString(),
          ')'
        );
      }

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Job Application Follow-up Reminder',
          body: `Time to follow up on your ${position} application at ${company}!`,
          data: { applicationId },
        },
        trigger: { type: 'date', date: notificationDate },
      });

      // Save notification data
      await NotificationService.saveNotification({
        id: notificationId,
        applicationId,
        company,
        position,
        followUpDate,
        notificationId,
      });

      console.log(`Scheduled notification ${notificationId} for ${notificationDate.toISOString()}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  },

  // Cancel a scheduled notification
  cancelNotification: async (notificationId: string): Promise<boolean> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await NotificationService.removeNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  },

  // Save notification data to AsyncStorage
  saveNotification: async (notification: FollowUpNotification): Promise<void> => {
    try {
      const notificationsJson = await AsyncStorage.getItem('follow_up_notifications');
      let notifications: FollowUpNotification[] = notificationsJson 
        ? JSON.parse(notificationsJson) 
        : [];
      
      // Remove any existing notifications for this application
      notifications = notifications.filter(n => n.applicationId !== notification.applicationId);
      
      // Add new notification
      notifications.push(notification);
      
      console.log(`Saved notification for application ${notification.applicationId}. Total notifications: ${notifications.length}`);
      
      // Save updated list
      await AsyncStorage.setItem('follow_up_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification data:', error);
    }
  },

  // Remove a notification from storage
  removeNotification: async (notificationId: string): Promise<void> => {
    try {
      const notificationsJson = await AsyncStorage.getItem('follow_up_notifications');
      if (!notificationsJson) return;
      
      let notifications: FollowUpNotification[] = JSON.parse(notificationsJson);
      notifications = notifications.filter(n => n.notificationId !== notificationId);
      
      await AsyncStorage.setItem('follow_up_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  },
  
  // Remove all notifications for a specific application
  removeNotificationsForApplication: async (applicationId: string): Promise<void> => {
    try {
      const notificationsJson = await AsyncStorage.getItem('follow_up_notifications');
      if (!notificationsJson) return;
      
      let notifications: FollowUpNotification[] = JSON.parse(notificationsJson);
      const beforeCount = notifications.length;
      notifications = notifications.filter(n => n.applicationId !== applicationId);
      const afterCount = notifications.length;
      
      console.log(`Removed ${beforeCount - afterCount} notifications for application ${applicationId} from storage`);
      await AsyncStorage.setItem('follow_up_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error removing notifications for application:', error);
    }
  },

  // Get all scheduled follow-up notifications
  getFollowUpNotifications: async (): Promise<FollowUpNotification[]> => {
    try {
      const notificationsJson = await AsyncStorage.getItem('follow_up_notifications');
      return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  // Get notifications for a specific application
  getApplicationNotifications: async (applicationId: string): Promise<FollowUpNotification[]> => {
    try {
      const notifications = await NotificationService.getFollowUpNotifications();
      return notifications.filter(n => n.applicationId === applicationId);
    } catch (error) {
      console.error('Error getting application notifications:', error);
      return [];
    }
  },
};

export default NotificationService;
