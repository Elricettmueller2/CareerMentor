import * as Notifications from 'expo-notifications';
import { NotificationResponse, Notification } from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import NotificationService from './NotificationService';

/**
 * Initialize notification handlers for the app
 * This should be called once when the app starts
 */
export const initializeNotifications = async () => {
  // Configure how notifications appear when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Set up notification received handler (when app is in foreground)
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification: Notification) => {
      console.log('Notification received in foreground:', notification);
    }
  );

  // Set up notification response handler (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response: NotificationResponse) => {
      const { notification } = response;
      const applicationId = notification.request.content.data?.applicationId as string;
      
      if (applicationId) {
        // Navigate to the TrackPal tab when notification is tapped
        router.push('/trackpal');
        
        // You could also navigate to a specific application detail view if implemented
        // router.push(`/application/${applicationId}`);
      }
    }
  );

  // Request permissions if needed
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8089B4',
    });
  }

  // Return cleanup function to unsubscribe when needed
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

export default initializeNotifications;
