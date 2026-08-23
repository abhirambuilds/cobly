"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const commentService_1 = require("../services/commentService");
class CommentController {
    static handleServiceError(error, res, next) {
        if (error instanceof Error && error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Project not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'DISCUSSION_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Discussion not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'COMMENT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Comment not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
            return;
        }
        next(error);
    }
    static async create(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const { content } = req.body;
            const comment = await commentService_1.CommentService.createComment(workspaceId, projectId, discussionId, req.user.id, {
                content
            });
            res.status(201).json({ comment });
        }
        catch (error) {
            CommentController.handleServiceError(error, res, next);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const comments = await commentService_1.CommentService.getCommentsByDiscussion(workspaceId, projectId, discussionId, req.user.id);
            res.status(200).json({ comments });
        }
        catch (error) {
            CommentController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const commentId = req.params.commentId;
            const { content } = req.body;
            const comment = await commentService_1.CommentService.updateComment(workspaceId, projectId, discussionId, commentId, req.user.id, {
                content
            });
            res.status(200).json({ comment });
        }
        catch (error) {
            CommentController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const commentId = req.params.commentId;
            await commentService_1.CommentService.deleteComment(workspaceId, projectId, discussionId, commentId, req.user.id);
            res.status(200).json({ success: true, message: 'Comment deleted' });
        }
        catch (error) {
            CommentController.handleServiceError(error, res, next);
        }
    }
}
exports.CommentController = CommentController;
