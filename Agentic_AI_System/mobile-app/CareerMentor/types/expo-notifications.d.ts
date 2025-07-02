declare module 'expo-notifications' {
  export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: NotificationTrigger | null;
  }

  export interface NotificationContent {
    title?: string;
    subtitle?: string;
    body?: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: boolean | string;
    priority?: AndroidNotificationPriority;
    vibrate?: boolean | number[];
    launchImageName?: string;
  }

  export interface Notification {
    date: number;
    request: NotificationRequest;
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
    userText?: string;
  }

  export type NotificationBehavior = {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
    priority?: AndroidNotificationPriority;
  };

  export type NotificationTrigger = null | {
    type: 'timeInterval';
    repeats: boolean;
    seconds: number;
  } | {
    type: 'calendar';
    repeats: boolean;
    dateComponents: {
      era?: number;
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
      weekday?: number;
      weekdayOrdinal?: number;
      quarter?: number;
      weekOfMonth?: number;
      weekOfYear?: number;
      yearForWeekOfYear?: number;
    };
  } | {
    type: 'date';
    date: Date | number;
  };

  export enum AndroidNotificationPriority {
    MIN = 'min',
    LOW = 'low',
    DEFAULT = 'default',
    HIGH = 'high',
    MAX = 'max',
  }

  export enum AndroidImportance {
    MIN = 0,
    LOW = 1,
    DEFAULT = 3,
    HIGH = 4,
    MAX = 5,
  }

  export interface NotificationChannelInput {
    name: string;
    importance: AndroidImportance;
    bypassDnd?: boolean;
    description?: string;
    enableLights?: boolean;
    enableVibrate?: boolean;
    groupId?: string;
    lightColor?: string;
    lockscreenVisibility?: number;
    showBadge?: boolean;
    sound?: string;
    vibrationPattern?: number[];
  }

  export type NotificationPermissionsStatus = {
    status: 'granted' | 'denied' | 'undetermined';
    granted: boolean;
    expires: 'never' | number;
    canAskAgain: boolean;
  };

  export function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function requestPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function setNotificationHandler(handler: { handleNotification: (notification: Notification) => Promise<NotificationBehavior> }): void;
  export function scheduleNotificationAsync(request: { content: NotificationContent; trigger: NotificationTrigger }): Promise<string>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function addNotificationReceivedListener(listener: (notification: Notification) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: NotificationResponse) => void): { remove: () => void };
  export function setNotificationChannelAsync(channelId: string, channel: NotificationChannelInput): Promise<boolean>;
}
