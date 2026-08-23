import { Router } from 'express';
import { z } from 'zod';
import { ProjectController } from '../controllers/projectController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

import taskRoutes from './task';

// mergeParams: true allows us to access req.params.workspaceId from the parent router
const router = Router({ mergeParams: true });

// ... existing schemas ...
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['planned', 'active', 'completed', 'archived']).optional(),
  deadline: z.string().datetime({ message: 'Invalid deadline format' }).optional().transform(val => val ? new Date(val) : undefined),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.enum(['planned', 'active', 'completed', 'archived']).optional(),
  deadline: z.string().datetime({ message: 'Invalid deadline format' }).optional().transform(val => val ? new Date(val) : undefined),
});

const projectIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid project ID format',
  }),
});

const workspaceIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
});

router.post('/', validateRequest({ params: workspaceIdParamSchema, body: createProjectSchema }), ProjectController.create);
router.get('/', validateRequest({ params: workspaceIdParamSchema }), ProjectController.list);
router.get('/:projectId', validateRequest({ params: projectIdParamSchema }), ProjectController.getById);
router.patch('/:projectId', validateRequest({ params: projectIdParamSchema, body: updateProjectSchema }), ProjectController.update);
router.delete('/:projectId', validateRequest({ params: projectIdParamSchema }), ProjectController.delete);

// Mount nested task routes
router.use('/:projectId/tasks', taskRoutes);

export default router;
