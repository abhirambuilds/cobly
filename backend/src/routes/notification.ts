import { Router } from 'express';
import { z } from 'zod';
import { NotificationController } from '../controllers/notificationController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router();

const notificationIdParamSchema = z.object({
  notificationId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid notification ID format',
  }),
});

router.get('/', NotificationController.list);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:notificationId/read', validateRequest({ params: notificationIdParamSchema }), NotificationController.markAsRead);
router.delete('/:notificationId', validateRequest({ params: notificationIdParamSchema }), NotificationController.delete);

export default router;
