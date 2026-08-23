import { api } from './api';
import type { NotificationsResponse, Notification } from '../types/notification';

export const notificationApi = {
  list: async (): Promise<NotificationsResponse> => {
    return api.get('/notifications');
  },
  
  markRead: async (notificationId: string): Promise<{ notification: Notification }> => {
    return api.patch(`/notifications/${notificationId}/read`, {});
  },
  
  markAllRead: async (): Promise<{ success: boolean }> => {
    return api.patch('/notifications/read-all', {});
  },
  
  delete: async (notificationId: string): Promise<{ success: boolean }> => {
    return api.del(`/notifications/${notificationId}`);
  }
};
