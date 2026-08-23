import { Router } from 'express';
import { z } from 'zod';
import { TaskController } from '../controllers/taskController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

// mergeParams: true allows us to access req.params.workspaceId and req.params.projectId
const router = Router({ mergeParams: true });

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  assignee: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid assignee ID format',
  }).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime({ message: 'Invalid due date format' }).optional().transform(val => val ? new Date(val) : undefined),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  assignee: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid assignee ID format',
  }).nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime({ message: 'Invalid due date format' }).optional().transform(val => val ? new Date(val) : undefined),
});

const taskParamsSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid project ID format',
  }),
  taskId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid task ID format',
  }).optional(), // Optional so the same schema can be used for list/create
});

const taskIdParamSchema = taskParamsSchema.extend({
  taskId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid task ID format',
  }),
});

router.post('/', validateRequest({ params: taskParamsSchema, body: createTaskSchema }), TaskController.create);
router.get('/', validateRequest({ params: taskParamsSchema }), TaskController.list);
router.get('/:taskId', validateRequest({ params: taskIdParamSchema }), TaskController.getById);
router.patch('/:taskId', validateRequest({ params: taskIdParamSchema, body: updateTaskSchema }), TaskController.update);
router.delete('/:taskId', validateRequest({ params: taskIdParamSchema }), TaskController.delete);

export default router;
