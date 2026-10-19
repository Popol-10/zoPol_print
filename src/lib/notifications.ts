import { apiRequest, withBearer } from "@/lib/api";

export interface NotificationRecord {
  id: string;
  title: string;
  detail: string;
  route: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationList {
  items: NotificationRecord[];
  unreadCount: number;
}

export interface NotificationPreferences {
  lowStockEnabled: boolean;
  orderDueEnabled: boolean;
  maintenanceEnabled: boolean;
}

export const notificationsApi = {
  list: (accessToken: string) =>
    apiRequest<NotificationList>("/notifications", {
      headers: withBearer(accessToken),
    }),
  markRead: (accessToken: string, notificationIds: string[]) =>
    apiRequest<{ markedRead: number }>("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ notificationIds }),
      headers: withBearer(accessToken),
    }),
  getPreferences: (accessToken: string) =>
    apiRequest<NotificationPreferences>("/notifications/preferences", {
      headers: withBearer(accessToken),
    }),
  updatePreferences: (
    accessToken: string,
    preferences: NotificationPreferences,
  ) =>
    apiRequest<NotificationPreferences>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
      headers: withBearer(accessToken),
    }),
};
