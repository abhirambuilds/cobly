import mongoose from 'mongoose';
import Notification, { INotification } from '../models/Notification';

export interface SafeNotification {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  static toSafeNotification(notification: INotification): SafeNotification {
    return {
      id: notification._id.toString(),
      workspaceId: notification.workspaceId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId?.toString(),
      read: notification.read,
      createdAt: notification.createdAt,
    };
  }

  /**
   * Safely logs a notification without disrupting primary operations.
   */
  static async sendNotification(params: {
    recipientId: string;
    workspaceId: string;
    type: 'workspace_member_added' | 'task_assigned' | 'meeting_created' | 'meeting_updated' | 'meeting_cancelled';
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }): Promise<void> {
    try {
      const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(params.recipientId),
        workspaceId: new mongoose.Types.ObjectId(params.workspaceId),
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId ? new mongoose.Types.ObjectId(params.entityId) : undefined,
        read: false,
      });
      await notification.save();
    } catch (error) {
      console.error('Failed to send notification:', error);
      // We intentionally do not throw to prevent breaking the primary mutation.
    }
  }

  static async getNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50): Promise<SafeNotification[]> {
    const query: Record<string, unknown> = { recipient: new mongoose.Types.ObjectId(userId) };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications.map(n => this.toSafeNotification(n));
  }

  static async markAsRead(notificationId: string, userId: string): Promise<SafeNotification> {
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      recipient: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    notification.read = true;
    await notification.save();

    return this.toSafeNotification(notification);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { recipient: new mongoose.Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );
  }

  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      recipient: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    await Notification.deleteOne({ _id: notification._id });
  }
}
