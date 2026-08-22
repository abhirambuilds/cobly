import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: { message: 'Authentication required' } });
        return;
      }

      const user = await User.findById(req.user.id);
      
      if (!user) {
        res.status(401).json({ error: { message: 'User not found' } });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
        return;
      }

      // Optionally attach full user to req if downstream needs it, 
      // but for strict authorization separation, we just authorize here.
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
