import { Router } from 'express';
import { z } from 'zod';
import { DiscussionController } from '../controllers/discussionController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router({ mergeParams: true });

const createDiscussionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
});

const updateDiscussionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long').optional(),
});

const discussionIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid project ID format',
  }),
  discussionId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid discussion ID format',
  }),
});

const projectIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid workspace ID format',
  }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid project ID format',
  }),
});

router.post('/', validateRequest({ params: projectIdParamSchema, body: createDiscussionSchema }), DiscussionController.create);
router.get('/', validateRequest({ params: projectIdParamSchema }), DiscussionController.list);
router.get('/:discussionId', validateRequest({ params: discussionIdParamSchema }), DiscussionController.getById);
router.patch('/:discussionId', validateRequest({ params: discussionIdParamSchema, body: updateDiscussionSchema }), DiscussionController.update);
router.delete('/:discussionId', validateRequest({ params: discussionIdParamSchema }), DiscussionController.delete);

export default router;
