import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  private static handleServiceError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof Error && error.message === 'NOTIFICATION_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Notification not found' } });
      return;
    }
    next(error);
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unreadOnly = req.query.unread === 'true';
      let limit = 50;
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
      }

      const notifications = await NotificationService.getNotifications(req.user!.id, unreadOnly, limit);
      res.status(200).json({ notifications });
    } catch (error) {
      NotificationController.handleServiceError(error, res, next);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationId = req.params.notificationId as string;
      const notification = await NotificationService.markAsRead(notificationId, req.user!.id);
      res.status(200).json({ notification });
    } catch (error) {
      NotificationController.handleServiceError(error, res, next);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      NotificationController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationId = req.params.notificationId as string;
      await NotificationService.deleteNotification(notificationId, req.user!.id);
      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      NotificationController.handleServiceError(error, res, next);
    }
  }
}
