"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const taskService_1 = require("../services/taskService");
class TaskController {
    static handleServiceError(error, res, next) {
        if (error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error.message === 'PROJECT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Project not found in this workspace' } });
            return;
        }
        if (error.message === 'TASK_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Task not found in this project' } });
            return;
        }
        if (error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
            return;
        }
        if (error.message === 'FORBIDDEN_FIELD_UPDATE') {
            res.status(403).json({ error: { message: 'Forbidden: you do not have permission to update one or more of these fields' } });
            return;
        }
        if (error.message === 'INVALID_ASSIGNEE') {
            res.status(400).json({ error: { message: 'Assignee must be a member of the workspace' } });
            return;
        }
        next(error);
    }
    static async create(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const { title, description, assignee, status, priority, dueDate } = req.body;
            const task = await taskService_1.TaskService.createTask(workspaceId, projectId, req.user.id, { title, description, assignee, status, priority, dueDate });
            res.status(201).json({ task });
        }
        catch (error) {
            TaskController.handleServiceError(error, res, next);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const { status, priority, assignee } = req.query;
            const tasks = await taskService_1.TaskService.getTasksByProject(workspaceId, projectId, req.user.id, { status, priority, assignee });
            res.status(200).json({ tasks });
        }
        catch (error) {
            TaskController.handleServiceError(error, res, next);
        }
    }
    static async getById(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const task = await taskService_1.TaskService.getTaskById(workspaceId, projectId, taskId, req.user.id);
            res.status(200).json({ task });
        }
        catch (error) {
            TaskController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            const { title, description, assignee, status, priority, dueDate } = req.body;
            const task = await taskService_1.TaskService.updateTask(workspaceId, projectId, taskId, req.user.id, { title, description, assignee, status, priority, dueDate });
            res.status(200).json({ task });
        }
        catch (error) {
            TaskController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const projectId = req.params.projectId;
            const taskId = req.params.taskId;
            await taskService_1.TaskService.deleteTask(workspaceId, projectId, taskId, req.user.id);
            res.status(200).json({ success: true, message: 'Task deleted' });
        }
        catch (error) {
            TaskController.handleServiceError(error, res, next);
        }
    }
}
exports.TaskController = TaskController;
