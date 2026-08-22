import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspaceService';
import mongoose from 'mongoose';

export class WorkspaceController {
  private static handleServiceError(error: any, res: Response, next: NextFunction) {
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

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const workspace = await WorkspaceService.createWorkspace(req.user!.id, { name, description });
      res.status(201).json({ workspace });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaces = await WorkspaceService.getWorkspacesForUser(req.user!.id);
      res.status(200).json({ workspaces });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const workspace = await WorkspaceService.getWorkspaceById(workspaceId, req.user!.id);
      res.status(200).json({ workspace });
    } catch (error) {
      WorkspaceController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { name, description } = req.body;
      const workspace = await WorkspaceService.updateWorkspace(workspaceId, req.user!.id, { name, description });
      res.status(200).json({ workspace });
    } catch (error) {
      WorkspaceController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      await WorkspaceService.deleteWorkspace(workspaceId, req.user!.id);
      res.status(200).json({ success: true, message: 'Workspace deleted' });
    } catch (error) {
      WorkspaceController.handleServiceError(error, res, next);
    }
  }
}
