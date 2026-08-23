"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const workspaceService_1 = require("../services/workspaceService");
class WorkspaceController {
    static handleServiceError(error, res, next) {
        if (error instanceof Error && error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions for this workspace' } });
            return;
        }
        next(error);
    }
    static async create(req, res, next) {
        try {
            const { name, description } = req.body;
            const workspace = await workspaceService_1.WorkspaceService.createWorkspace(req.user.id, { name, description });
            res.status(201).json({ workspace });
        }
        catch (error) {
            next(error);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaces = await workspaceService_1.WorkspaceService.getWorkspacesForUser(req.user.id);
            res.status(200).json({ workspaces });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const workspace = await workspaceService_1.WorkspaceService.getWorkspaceById(workspaceId, req.user.id);
            res.status(200).json({ workspace });
        }
        catch (error) {
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const { name, description } = req.body;
            const workspace = await workspaceService_1.WorkspaceService.updateWorkspace(workspaceId, req.user.id, { name, description });
            res.status(200).json({ workspace });
        }
        catch (error) {
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            await workspaceService_1.WorkspaceService.deleteWorkspace(workspaceId, req.user.id);
            res.status(200).json({ success: true, message: 'Workspace deleted' });
        }
        catch (error) {
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
    // --- MEMBERSHIP ---
    static async getMembers(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const members = await workspaceService_1.WorkspaceService.getMembers(workspaceId, req.user.id);
            res.status(200).json({ members });
        }
        catch (error) {
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
    static async addMember(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const { userId } = req.body;
            await workspaceService_1.WorkspaceService.addMember(workspaceId, req.user.id, userId);
            res.status(200).json({ success: true, message: 'Member added' });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
                res.status(404).json({ error: { message: 'Target user not found' } });
                return;
            }
            if (error instanceof Error && error.message === 'ALREADY_MEMBER') {
                res.status(409).json({ error: { message: 'User is already a member' } });
                return;
            }
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
    static async removeMember(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const targetUserId = req.params.userId;
            await workspaceService_1.WorkspaceService.removeMember(workspaceId, req.user.id, targetUserId);
            res.status(200).json({ success: true, message: 'Member removed' });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'MEMBER_NOT_FOUND') {
                res.status(404).json({ error: { message: 'Member not found in workspace' } });
                return;
            }
            if (error instanceof Error && error.message === 'CANNOT_REMOVE_OWNER') {
                res.status(400).json({ error: { message: 'Cannot remove the workspace owner' } });
                return;
            }
            WorkspaceController.handleServiceError(error, res, next);
        }
    }
}
exports.WorkspaceController = WorkspaceController;
