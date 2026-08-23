import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activityService';

export class ActivityController {
  private static handleServiceError(error: any, res: Response, next: NextFunction) {
    if (error.message === 'WORKSPACE_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Workspace not found' } });
      return;
    }
    if (error.message === 'FORBIDDEN') {
      res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
      return;
    }
    next(error);
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const activities = await ActivityService.getWorkspaceActivity(workspaceId, req.user!.id);
      res.status(200).json({ activities });
    } catch (error) {
      ActivityController.handleServiceError(error, res, next);
    }
  }
}
