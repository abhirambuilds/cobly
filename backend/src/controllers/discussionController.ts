import { Request, Response, NextFunction } from 'express';
import { DiscussionService } from '../services/discussionService';

export class DiscussionController {
  private static handleServiceError(error: any, res: Response, next: NextFunction) {
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

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const { title, content } = req.body;
      
      const discussion = await DiscussionService.createDiscussion(workspaceId, projectId, req.user!.id, {
        title, content
      });
      res.status(201).json({ discussion });
    } catch (error) {
      DiscussionController.handleServiceError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      
      let limit = 50;
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit);
      }

      const discussions = await DiscussionService.getDiscussionsByProject(workspaceId, projectId, req.user!.id, limit);
      res.status(200).json({ discussions });
    } catch (error) {
      DiscussionController.handleServiceError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      
      const discussion = await DiscussionService.getDiscussionById(workspaceId, projectId, discussionId, req.user!.id);
      res.status(200).json({ discussion });
    } catch (error) {
      DiscussionController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      const { title, content } = req.body;
      
      const discussion = await DiscussionService.updateDiscussion(workspaceId, projectId, discussionId, req.user!.id, {
        title, content
      });
      res.status(200).json({ discussion });
    } catch (error) {
      DiscussionController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      
      await DiscussionService.deleteDiscussion(workspaceId, projectId, discussionId, req.user!.id);
      res.status(200).json({ success: true, message: 'Discussion deleted' });
    } catch (error) {
      DiscussionController.handleServiceError(error, res, next);
    }
  }
}
