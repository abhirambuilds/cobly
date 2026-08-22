"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const projectService_1 = require("../services/projectService");
class ProjectController {
    static handleServiceError(error, res, next) {
        if (error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error.message === 'PROJECT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Project not found in this workspace' } });
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
            const { name, description, status, deadline } = req.body;
            const project = await projectService_1.ProjectService.createProject(workspaceId, req.user.id, { name, description, status, deadline });
            res.status(201).json({ project });
        }
        catch (error) {
            ProjectController.handleServiceError(error, res, next);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projects = await projectService_1.ProjectService.getProjectsByWorkspace(workspaceId, req.user.id);
            res.status(200).json({ projects });
        }
        catch (error) {
            ProjectController.handleServiceError(error, res, next);
        }
    }
    static async getById(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const project = await projectService_1.ProjectService.getProjectById(workspaceId, projectId, req.user.id);
            res.status(200).json({ project });
        }
        catch (error) {
            ProjectController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const { name, description, status, deadline } = req.body;
            const project = await projectService_1.ProjectService.updateProject(workspaceId, projectId, req.user.id, { name, description, status, deadline });
            res.status(200).json({ project });
        }
        catch (error) {
            ProjectController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            await projectService_1.ProjectService.deleteProject(workspaceId, projectId, req.user.id);
            res.status(200).json({ success: true, message: 'Project deleted' });
        }
        catch (error) {
            ProjectController.handleServiceError(error, res, next);
        }
    }
}
exports.ProjectController = ProjectController;
