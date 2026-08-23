"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
class NotificationController {
    static handleServiceError(error, res, next) {
        if (error instanceof Error && error.message === 'NOTIFICATION_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Notification not found' } });
            return;
        }
        next(error);
    }
    static async list(req, res, next) {
        try {
            const unreadOnly = req.query.unread === 'true';
            let limit = 50;
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit);
            }
            const notifications = await notificationService_1.NotificationService.getNotifications(req.user.id, unreadOnly, limit);
            res.status(200).json({ notifications });
        }
        catch (error) {
            NotificationController.handleServiceError(error, res, next);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const notificationId = req.params.notificationId;
            const notification = await notificationService_1.NotificationService.markAsRead(notificationId, req.user.id);
            res.status(200).json({ notification });
        }
        catch (error) {
            NotificationController.handleServiceError(error, res, next);
        }
    }
    static async markAllAsRead(req, res, next) {
        try {
            await notificationService_1.NotificationService.markAllAsRead(req.user.id);
            res.status(200).json({ success: true, message: 'All notifications marked as read' });
        }
        catch (error) {
            NotificationController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const notificationId = req.params.notificationId;
            await notificationService_1.NotificationService.deleteNotification(notificationId, req.user.id);
            res.status(200).json({ success: true, message: 'Notification deleted' });
        }
        catch (error) {
            NotificationController.handleServiceError(error, res, next);
        }
    }
}
exports.NotificationController = NotificationController;
