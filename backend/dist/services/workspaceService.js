"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const User_1 = __importDefault(require("../models/User"));
const activityService_1 = require("./activityService");
class WorkspaceService {
    /**
     * Converts a Mongoose IWorkspace document into a safe API representation,
     * completely hiding the internal members array and mapping _id to id.
     */
    static toSafeWorkspace(workspace) {
        return {
            id: workspace._id.toString(),
            name: workspace.name,
            description: workspace.description,
            ownerId: workspace.owner.toString(),
            membersCount: workspace.members.length,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        };
    }
    static async createWorkspace(userId, data) {
        const workspace = new Workspace_1.default({
            name: data.name,
            description: data.description,
            owner: new mongoose_1.default.Types.ObjectId(userId),
            members: [{ user: new mongoose_1.default.Types.ObjectId(userId), role: 'owner' }],
        });
        await workspace.save();
        // Log activity
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspace._id.toString(),
            actorId: userId,
            action: 'workspace_created',
            entityType: 'workspace',
            entityId: workspace._id.toString(),
            metadata: { name: workspace.name }
        });
        return this.toSafeWorkspace(workspace);
    }
    static async getWorkspacesForUser(userId) {
        const workspaces = await Workspace_1.default.find({ 'members.user': new mongoose_1.default.Types.ObjectId(userId) });
        return workspaces.map(w => this.toSafeWorkspace(w));
    }
    /**
     * Gets a specific workspace by ID, ensuring the user is a member.
     */
    static async getWorkspaceById(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const isMember = workspace.members.some(m => m.user.toString() === userId);
        if (!isMember) {
            throw new Error('FORBIDDEN');
        }
        return this.toSafeWorkspace(workspace);
    }
    /**
     * Updates a workspace, ensuring the user is the owner.
     */
    static async updateWorkspace(workspaceId, userId, data) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || member.role !== 'owner') {
            throw new Error('FORBIDDEN');
        }
        if (data.name !== undefined)
            workspace.name = data.name;
        if (data.description !== undefined)
            workspace.description = data.description;
        await workspace.save();
        // Log activity
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspace._id.toString(),
            actorId: userId,
            action: 'workspace_updated',
            entityType: 'workspace',
            entityId: workspace._id.toString(),
        });
        return this.toSafeWorkspace(workspace);
    }
    /**
     * Deletes a workspace, ensuring the user is the owner.
     */
    static async deleteWorkspace(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || member.role !== 'owner') {
            throw new Error('FORBIDDEN');
        }
        await Workspace_1.default.deleteOne({ _id: workspace._id });
    }
    // --- MEMBERSHIP MANAGEMENT ---
    static async getMembers(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId).populate('members.user', 'name email');
        if (!workspace)
            throw new Error('NOT_FOUND');
        const isMember = workspace.members.some(m => m.user._id.toString() === userId);
        if (!isMember)
            throw new Error('FORBIDDEN');
        return workspace.members.map(m => {
            const u = m.user;
            return {
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: m.role
            };
        });
    }
    static async addMember(workspaceId, requesterId, targetUserId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('NOT_FOUND');
        const requester = workspace.members.find(m => m.user.toString() === requesterId);
        if (!requester || requester.role !== 'owner')
            throw new Error('FORBIDDEN');
        // target user must exist
        const target = await User_1.default.findById(targetUserId);
        if (!target)
            throw new Error('USER_NOT_FOUND');
        const alreadyMember = workspace.members.some(m => m.user.toString() === targetUserId);
        if (alreadyMember)
            throw new Error('ALREADY_MEMBER');
        workspace.members.push({ user: new mongoose_1.default.Types.ObjectId(targetUserId), role: 'member' });
        await workspace.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspace._id.toString(),
            actorId: requesterId,
            action: 'member_added',
            entityType: 'member',
            entityId: targetUserId,
            metadata: { name: target.name }
        });
        if (requesterId !== targetUserId) {
            const { NotificationService } = await import('./notificationService.js');
            await NotificationService.sendNotification({
                recipientId: targetUserId,
                workspaceId: workspace._id.toString(),
                type: 'workspace_member_added',
                title: 'Added to workspace',
                message: `You were added to workspace: ${workspace.name}`,
            });
        }
    }
    static async removeMember(workspaceId, requesterId, targetUserId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('NOT_FOUND');
        const requester = workspace.members.find(m => m.user.toString() === requesterId);
        if (!requester || requester.role !== 'owner')
            throw new Error('FORBIDDEN');
        const targetIndex = workspace.members.findIndex(m => m.user.toString() === targetUserId);
        if (targetIndex === -1)
            throw new Error('MEMBER_NOT_FOUND');
        if (workspace.members[targetIndex].role === 'owner') {
            throw new Error('CANNOT_REMOVE_OWNER');
        }
        workspace.members.splice(targetIndex, 1);
        await workspace.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspace._id.toString(),
            actorId: requesterId,
            action: 'member_removed',
            entityType: 'member',
            entityId: targetUserId
        });
    }
}
exports.WorkspaceService = WorkspaceService;
