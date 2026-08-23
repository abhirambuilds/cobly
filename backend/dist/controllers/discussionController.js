"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscussionController = void 0;
const discussionService_1 = require("../services/discussionService");
class DiscussionController {
    static handleServiceError(error, res, next) {
        if (error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error.message === 'PROJECT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Project not found' } });
            return;
        }
        if (error.message === 'DISCUSSION_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Discussion not found' } });
            return;
        }
        if (error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
            return;
        }
        next(error);
    }
    static async create(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const { title, content } = req.body;
            const discussion = await discussionService_1.DiscussionService.createDiscussion(workspaceId, projectId, req.user.id, {
                title, content
            });
            res.status(201).json({ discussion });
        }
        catch (error) {
            DiscussionController.handleServiceError(error, res, next);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            let limit = 50;
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit);
            }
            const discussions = await discussionService_1.DiscussionService.getDiscussionsByProject(workspaceId, projectId, req.user.id, limit);
            res.status(200).json({ discussions });
        }
        catch (error) {
            DiscussionController.handleServiceError(error, res, next);
        }
    }
    static async getById(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const discussion = await discussionService_1.DiscussionService.getDiscussionById(workspaceId, projectId, discussionId, req.user.id);
            res.status(200).json({ discussion });
        }
        catch (error) {
            DiscussionController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            const { title, content } = req.body;
            const discussion = await discussionService_1.DiscussionService.updateDiscussion(workspaceId, projectId, discussionId, req.user.id, {
                title, content
            });
            res.status(200).json({ discussion });
        }
        catch (error) {
            DiscussionController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const discussionId = req.params.discussionId;
            await discussionService_1.DiscussionService.deleteDiscussion(workspaceId, projectId, discussionId, req.user.id);
            res.status(200).json({ success: true, message: 'Discussion deleted' });
        }
        catch (error) {
            DiscussionController.handleServiceError(error, res, next);
        }
    }
}
exports.DiscussionController = DiscussionController;
