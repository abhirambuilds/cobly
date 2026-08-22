"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceController = void 0;
const workspaceService_1 = require("../services/workspaceService");
class WorkspaceController {
    static handleServiceError(error, res, next) {
        if (error.message === 'NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error.message === 'FORBIDDEN') {
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
}
exports.WorkspaceController = WorkspaceController;
