import { Router } from 'express';
import { z } from 'zod';
import { WorkspaceController } from '../controllers/workspaceController';
import { requireAuth } from '../middleware/requireAuth';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

import projectRoutes from './project';
import activityRoutes from './activity';

const router = Router();

// ... existing schemas ...
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

const addMemberSchema = z.object({
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid user ID format',
  }),
});

const memberIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid user ID format',
  }),
});

router.use(requireAuth);

router.post('/', validateRequest({ body: createWorkspaceSchema }), WorkspaceController.create);
router.get('/', WorkspaceController.list);
router.get('/:workspaceId', validateRequest({ params: workspaceIdParamSchema }), WorkspaceController.getById);
router.patch('/:workspaceId', validateRequest({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }), WorkspaceController.update);
router.delete('/:workspaceId', validateRequest({ params: workspaceIdParamSchema }), WorkspaceController.delete);

// Membership routes
router.get('/:workspaceId/members', validateRequest({ params: workspaceIdParamSchema }), WorkspaceController.getMembers);
router.post('/:workspaceId/members', validateRequest({ params: workspaceIdParamSchema, body: addMemberSchema }), WorkspaceController.addMember);
router.delete('/:workspaceId/members/:userId', validateRequest({ params: memberIdParamSchema }), WorkspaceController.removeMember);

// Mount nested routes
router.use('/:workspaceId/projects', projectRoutes);
router.use('/:workspaceId/activity', activityRoutes);

export default router;
