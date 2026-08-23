import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';

export class TaskController {
  private static handleServiceError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof Error && error.message === 'WORKSPACE_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Workspace not found' } });
      return;
    }
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Project not found in this workspace' } });
      return;
    }
    if (error instanceof Error && error.message === 'TASK_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Task not found in this project' } });
      return;
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
      return;
    }
    if (error instanceof Error && error.message === 'FORBIDDEN_FIELD_UPDATE') {
      res.status(403).json({ error: { message: 'Forbidden: you do not have permission to update one or more of these fields' } });
      return;
    }
    if (error instanceof Error && error.message === 'INVALID_ASSIGNEE') {
      res.status(400).json({ error: { message: 'Assignee must be a member of the workspace' } });
      return;
    }
    next(error);
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const { title, description, assignee, status, priority, dueDate } = req.body;
      const task = await TaskService.createTask(workspaceId, projectId, req.user!.id, { title, description, assignee, status, priority, dueDate });
      res.status(201).json({ task });
    } catch (error) {
      TaskController.handleServiceError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const { status, priority, assignee } = req.query as { status?: string, priority?: string, assignee?: string };
      const tasks = await TaskService.getTasksByProject(workspaceId, projectId, req.user!.id, { status, priority, assignee });
      res.status(200).json({ tasks });
    } catch (error) {
      TaskController.handleServiceError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;
      const task = await TaskService.getTaskById(workspaceId, projectId, taskId, req.user!.id);
      res.status(200).json({ task });
    } catch (error) {
      TaskController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;
      const { title, description, assignee, status, priority, dueDate } = req.body;
      const task = await TaskService.updateTask(workspaceId, projectId, taskId, req.user!.id, { title, description, assignee, status, priority, dueDate });
      res.status(200).json({ task });
    } catch (error) {
      TaskController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const taskId = req.params.taskId as string;
      await TaskService.deleteTask(workspaceId, projectId, taskId, req.user!.id);
      res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (error) {
      TaskController.handleServiceError(error, res, next);
    }
  }
}
