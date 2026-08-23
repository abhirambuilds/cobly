import { Router } from 'express';
import { z } from 'zod';
import { CommentController } from '../controllers/commentController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router({ mergeParams: true });

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content is too long').optional(),
});

const discussionIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }),
  discussionId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid discussion ID format' }),
});

const commentIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }),
  discussionId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid discussion ID format' }),
  commentId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid comment ID format' }),
});

router.post('/', validateRequest({ params: discussionIdParamSchema, body: createCommentSchema }), CommentController.create);
router.get('/', validateRequest({ params: discussionIdParamSchema }), CommentController.list);
router.patch('/:commentId', validateRequest({ params: commentIdParamSchema, body: updateCommentSchema }), CommentController.update);
router.delete('/:commentId', validateRequest({ params: commentIdParamSchema }), CommentController.delete);

export default router;
