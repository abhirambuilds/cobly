import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/commentService';

export class CommentController {
  private static handleServiceError(error: unknown, res: Response, next: NextFunction) {
    if (error instanceof Error && error.message === 'WORKSPACE_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Workspace not found' } });
      return;
    }
    if (error instanceof Error && error.message === 'PROJECT_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Project not found' } });
      return;
    }
    if (error instanceof Error && error.message === 'DISCUSSION_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Discussion not found' } });
      return;
    }
    if (error instanceof Error && error.message === 'COMMENT_NOT_FOUND') {
      res.status(404).json({ error: { message: 'Comment not found' } });
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
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      const { content } = req.body;
      
      const comment = await CommentService.createComment(workspaceId, projectId, discussionId, req.user!.id, {
        content
      });
      res.status(201).json({ comment });
    } catch (error) {
      CommentController.handleServiceError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;

      const comments = await CommentService.getCommentsByDiscussion(workspaceId, projectId, discussionId, req.user!.id);
      res.status(200).json({ comments });
    } catch (error) {
      CommentController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      const commentId = req.params.commentId as string;
      const { content } = req.body;
      
      const comment = await CommentService.updateComment(workspaceId, projectId, discussionId, commentId, req.user!.id, {
        content
      });
      res.status(200).json({ comment });
    } catch (error) {
      CommentController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const projectId = req.params.projectId as string;
      const discussionId = req.params.discussionId as string;
      const commentId = req.params.commentId as string;
      
      await CommentService.deleteComment(workspaceId, projectId, discussionId, commentId, req.user!.id);
      res.status(200).json({ success: true, message: 'Comment deleted' });
    } catch (error) {
      CommentController.handleServiceError(error, res, next);
    }
  }
}
