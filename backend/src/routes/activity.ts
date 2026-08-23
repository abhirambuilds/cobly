import { Router } from 'express';
import { z } from 'zod';
import { ActivityController } from '../controllers/activityController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router({ mergeParams: true });

const workspaceIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
});

router.get('/', validateRequest({ params: workspaceIdParamSchema }), ActivityController.list);

export default router;
