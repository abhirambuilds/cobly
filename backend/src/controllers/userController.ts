import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  /**
   * Retrieves the currently authenticated user's profile based on the JWT context.
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: { message: 'Authentication required' } });
        return;
      }

      const safeProfile = await UserService.getUserProfile(req.user.id);
      
      res.status(200).json({ user: safeProfile });
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: { message: 'User profile not found' } });
        return;
      }
      next(error);
    }
  }
}
