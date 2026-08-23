import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';

export class ProjectController {
  private static handleServiceError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof Error && error.message === 'WORKSPACE_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Workspace not found' } });
      return;
    }
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Project not found in this workspace' } });
      return;
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
      return;
    }
    next(error);
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { name, description, status, deadline } = req.body;
      const project = await ProjectService.createProject(workspaceId, req.user!.id, { name, description, status, deadline });
      res.status(201).json({ project });
    } catch (error) {
      ProjectController.handleServiceError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projects = await ProjectService.getProjectsByWorkspace(workspaceId, req.user!.id);
      res.status(200).json({ projects });
    } catch (error) {
      ProjectController.handleServiceError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const project = await ProjectService.getProjectById(workspaceId, projectId, req.user!.id);
      res.status(200).json({ project });
    } catch (error) {
      ProjectController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const { name, description, status, deadline } = req.body;
      const project = await ProjectService.updateProject(workspaceId, projectId, req.user!.id, { name, description, status, deadline });
      res.status(200).json({ project });
    } catch (error) {
      ProjectController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      await ProjectService.deleteProject(workspaceId, projectId, req.user!.id);
      res.status(200).json({ success: true, message: 'Project deleted' });
    } catch (error) {
      ProjectController.handleServiceError(error, res, next);
    }
  }
}
