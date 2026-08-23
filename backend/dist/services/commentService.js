"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Discussion_1 = __importDefault(require("../models/Discussion"));
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const activityService_1 = require("./activityService");
class CommentService {
    static toSafeComment(comment) {
        let safeAuthor = { id: '', name: 'Unknown', email: 'Unknown' };
        if (comment.author) {
            if (typeof comment.author === 'object' && '_id' in comment.author) {
                const user = comment.author;
                safeAuthor = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            }
            else {
                safeAuthor.id = comment.author.toString();
            }
        }
        return {
            id: comment._id.toString(),
            workspaceId: comment.workspaceId.toString(),
            projectId: comment.projectId.toString(),
            discussionId: comment.discussionId.toString(),
            author: safeAuthor,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }
    static async getContext(workspaceId, projectId, discussionId, userId) {
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
        const discussion = await Discussion_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(discussionId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!discussion)
            throw new Error('DISCUSSION_NOT_FOUND');
        return {
            isWorkspaceMember: !!member,
            isWorkspaceOwner: member?.role === 'owner',
            isProjectOwner: project.owner.toString() === userId,
            workspace
        };
    }
    static async createComment(workspaceId, projectId, discussionId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, discussionId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const comment = new Comment_1.default({
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId),
            discussionId: new mongoose_1.default.Types.ObjectId(discussionId),
            author: new mongoose_1.default.Types.ObjectId(userId),
            content: data.content,
        });
        await comment.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'comment_created',
            entityType: 'comment',
            entityId: comment._id.toString(),
            metadata: { discussionId }
        });
        await comment.populate('author', 'name email');
        return this.toSafeComment(comment);
    }
    static async getCommentsByDiscussion(workspaceId, projectId, discussionId, userId) {
        const context = await this.getContext(workspaceId, projectId, discussionId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const comments = await Comment_1.default.find({ discussionId: new mongoose_1.default.Types.ObjectId(discussionId) })
            .sort({ createdAt: 1 })
            .populate('author', 'name email');
        return comments.map(c => this.toSafeComment(c));
    }
    static async updateComment(workspaceId, projectId, discussionId, commentId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, discussionId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const comment = await Comment_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(commentId),
            discussionId: new mongoose_1.default.Types.ObjectId(discussionId)
        });
        if (!comment) {
            throw new Error('COMMENT_NOT_FOUND');
        }
        const isCommentAuthor = comment.author.toString() === userId;
        const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
        if (!isCommentAuthor && !isOwner) {
            throw new Error('FORBIDDEN');
        }
        const changes = {};
        if (data.content !== undefined) {
            comment.content = data.content;
            changes.content = true;
        }
        await comment.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'comment_updated',
            entityType: 'comment',
            entityId: comment._id.toString(),
            metadata: changes
        });
        await comment.populate('author', 'name email');
        return this.toSafeComment(comment);
    }
    static async deleteComment(workspaceId, projectId, discussionId, commentId, userId) {
        const context = await this.getContext(workspaceId, projectId, discussionId, userId);
        const comment = await Comment_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(commentId),
            discussionId: new mongoose_1.default.Types.ObjectId(discussionId)
        });
        if (!comment) {
            throw new Error('COMMENT_NOT_FOUND');
        }
        const isCommentAuthor = comment.author.toString() === userId;
        const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
        if (!isCommentAuthor && !isOwner) {
            throw new Error('FORBIDDEN');
        }
        await Comment_1.default.deleteOne({ _id: comment._id });
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'comment_deleted',
            entityType: 'comment',
            entityId: comment._id.toString(),
            metadata: { discussionId }
        });
    }
}
exports.CommentService = CommentService;
