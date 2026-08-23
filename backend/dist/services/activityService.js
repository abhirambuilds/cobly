"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Activity_1 = __importDefault(require("../models/Activity"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
class ActivityService {
    /**
     * Safely logs an activity without disrupting primary operations.
     */
    static async recordActivity(params) {
        try {
            const activity = new Activity_1.default({
                workspaceId: new mongoose_1.default.Types.ObjectId(params.workspaceId),
                actorId: new mongoose_1.default.Types.ObjectId(params.actorId),
                action: params.action,
                entityType: params.entityType,
                entityId: new mongoose_1.default.Types.ObjectId(params.entityId),
                metadata: params.metadata,
            });
            await activity.save();
        }
        catch (error) {
            console.error('Failed to log activity:', error);
            // We intentionally do not throw to prevent breaking the primary mutation.
        }
    }
    static toSafeActivity(activity) {
        const actor = activity.actorId;
        return {
            id: activity._id.toString(),
            workspaceId: activity.workspaceId.toString(),
            actor: {
                id: actor._id.toString(),
                name: actor.name,
                email: actor.email,
            },
            action: activity.action,
            entityType: activity.entityType,
            entityId: activity.entityId.toString(),
            metadata: activity.metadata,
            createdAt: activity.createdAt,
        };
    }
    static async getWorkspaceActivity(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('WORKSPACE_NOT_FOUND');
        const isMember = workspace.members.some(m => m.user.toString() === userId);
        if (!isMember)
            throw new Error('FORBIDDEN');
        // Limit to recent 100 for basic safety
        const activities = await Activity_1.default.find({ workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('actorId', 'name email');
        return activities.map(a => this.toSafeActivity(a));
    }
}
exports.ActivityService = ActivityService;
