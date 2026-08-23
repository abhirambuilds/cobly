import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspaceService';
import mongoose from 'mongoose';

export class WorkspaceController {
  private static handleServiceError(error: unknown, res: Response, next: NextFunction) {
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

  // --- MEMBERSHIP ---

  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const members = await WorkspaceService.getMembers(workspaceId, req.user!.id);
      res.status(200).json({ members });
    } catch (error) {
      WorkspaceController.handleServiceError(error, res, next);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { userId } = req.body;
      
      await WorkspaceService.addMember(workspaceId, req.user!.id, userId);
      res.status(200).json({ success: true, message: 'Member added' });
    } catch (error: unknown) {
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

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const targetUserId = req.params.userId as string;
      
      await WorkspaceService.removeMember(workspaceId, req.user!.id, targetUserId);
      res.status(200).json({ success: true, message: 'Member removed' });
    } catch (error: unknown) {
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
