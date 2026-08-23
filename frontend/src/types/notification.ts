export interface Notification {
  id: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
  workspaceId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}
