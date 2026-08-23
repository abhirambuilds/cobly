"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Discussion_1 = __importDefault(require("../models/Discussion"));
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const activityService_1 = require("./activityService");
class DiscussionService {
    static toSafeDiscussion(discussion) {
        let safeAuthor = { id: '', name: 'Unknown', email: 'Unknown' };
        if (discussion.author) {
            if (typeof discussion.author === 'object' && '_id' in discussion.author) {
                const user = discussion.author;
                safeAuthor = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            }
            else {
                safeAuthor.id = discussion.author.toString();
            }
        }
        return {
            id: discussion._id.toString(),
            workspaceId: discussion.workspaceId.toString(),
            projectId: discussion.projectId.toString(),
            author: safeAuthor,
            title: discussion.title,
            content: discussion.content,
            createdAt: discussion.createdAt,
            updatedAt: discussion.updatedAt,
        };
    }
    static async getContext(workspaceId, projectId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('WORKSPACE_NOT_FOUND');
        const member = workspace.members.find(m => m.user.toString() === userId);
        const project = await Project_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!project)
            throw new Error('PROJECT_NOT_FOUND');
        return {
            isWorkspaceMember: !!member,
            isWorkspaceOwner: member?.role === 'owner',
            isProjectOwner: project.owner.toString() === userId,
            workspace
        };
    }
    static async createDiscussion(workspaceId, projectId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const discussion = new Discussion_1.default({
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId),
            author: new mongoose_1.default.Types.ObjectId(userId),
            title: data.title,
            content: data.content,
        });
        await discussion.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'discussion_created',
            entityType: 'discussion',
            entityId: discussion._id.toString(),
            metadata: { title: discussion.title }
        });
        await discussion.populate('author', 'name email');
        return this.toSafeDiscussion(discussion);
    }
    static async getDiscussionsByProject(workspaceId, projectId, userId, limit = 50) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const discussions = await Discussion_1.default.find({ projectId: new mongoose_1.default.Types.ObjectId(projectId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('author', 'name email');
        return discussions.map(d => this.toSafeDiscussion(d));
    }
    static async getDiscussionById(workspaceId, projectId, discussionId, userId) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const discussion = await Discussion_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(discussionId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        }).populate('author', 'name email');
        if (!discussion) {
            throw new Error('DISCUSSION_NOT_FOUND');
        }
        return this.toSafeDiscussion(discussion);
    }
    static async updateDiscussion(workspaceId, projectId, discussionId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const discussion = await Discussion_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(discussionId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        });
        if (!discussion) {
            throw new Error('DISCUSSION_NOT_FOUND');
        }
        const isDiscussionAuthor = discussion.author.toString() === userId;
        const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
        if (!isDiscussionAuthor && !isOwner) {
            throw new Error('FORBIDDEN');
        }
        const changes = {};
        if (data.title !== undefined) {
            discussion.title = data.title;
            changes.title = true;
        }
        if (data.content !== undefined) {
            discussion.content = data.content;
        }
        await discussion.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'discussion_updated',
            entityType: 'discussion',
            entityId: discussion._id.toString(),
            metadata: changes
        });
        await discussion.populate('author', 'name email');
        return this.toSafeDiscussion(discussion);
    }
    static async deleteDiscussion(workspaceId, projectId, discussionId, userId) {
        const context = await this.getContext(workspaceId, projectId, userId);
        const discussion = await Discussion_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(discussionId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        });
        if (!discussion) {
            throw new Error('DISCUSSION_NOT_FOUND');
        }
        const isDiscussionAuthor = discussion.author.toString() === userId;
        const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
        if (!isDiscussionAuthor && !isOwner) {
            throw new Error('FORBIDDEN');
        }
        await Discussion_1.default.deleteOne({ _id: discussion._id });
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'discussion_deleted',
            entityType: 'discussion',
            entityId: discussion._id.toString(),
            metadata: { title: discussion.title }
        });
    }
}
exports.DiscussionService = DiscussionService;
