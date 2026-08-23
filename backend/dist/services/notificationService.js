"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = __importDefault(require("../models/Notification"));
class NotificationService {
    static toSafeNotification(notification) {
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
    static async sendNotification(params) {
        try {
            const notification = new Notification_1.default({
                recipient: new mongoose_1.default.Types.ObjectId(params.recipientId),
                workspaceId: new mongoose_1.default.Types.ObjectId(params.workspaceId),
                type: params.type,
                title: params.title,
                message: params.message,
                entityType: params.entityType,
                entityId: params.entityId ? new mongoose_1.default.Types.ObjectId(params.entityId) : undefined,
                read: false,
            });
            await notification.save();
        }
        catch (error) {
            console.error('Failed to send notification:', error);
            // We intentionally do not throw to prevent breaking the primary mutation.
        }
    }
    static async getNotifications(userId, unreadOnly = false, limit = 50) {
        const query = { recipient: new mongoose_1.default.Types.ObjectId(userId) };
        if (unreadOnly) {
            query.read = false;
        }
        const notifications = await Notification_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);
        return notifications.map(n => this.toSafeNotification(n));
    }
    static async markAsRead(notificationId, userId) {
        const notification = await Notification_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(notificationId),
            recipient: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!notification) {
            throw new Error('NOTIFICATION_NOT_FOUND');
        }
        notification.read = true;
        await notification.save();
        return this.toSafeNotification(notification);
    }
    static async markAllAsRead(userId) {
        await Notification_1.default.updateMany({ recipient: new mongoose_1.default.Types.ObjectId(userId), read: false }, { $set: { read: true } });
    }
    static async deleteNotification(notificationId, userId) {
        const notification = await Notification_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(notificationId),
            recipient: new mongoose_1.default.Types.ObjectId(userId),
        });
        if (!notification) {
            throw new Error('NOTIFICATION_NOT_FOUND');
        }
        await Notification_1.default.deleteOne({ _id: notification._id });
    }
}
exports.NotificationService = NotificationService;
