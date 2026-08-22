import { Router } from 'express';
import { z } from 'zod';
import { WorkspaceController } from '../controllers/workspaceController';
import { requireAuth } from '../middleware/requireAuth';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
});

const workspaceIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
});

router.use(requireAuth);

router.post('/', validateRequest({ body: createWorkspaceSchema }), WorkspaceController.create);
router.get('/', WorkspaceController.list);
router.get('/:workspaceId', validateRequest({ params: workspaceIdParamSchema }), WorkspaceController.getById);
router.patch('/:workspaceId', validateRequest({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }), WorkspaceController.update);
router.delete('/:workspaceId', validateRequest({ params: workspaceIdParamSchema }), WorkspaceController.delete);

export default router;
