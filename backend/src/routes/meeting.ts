import { Router } from 'express';
import { z } from 'zod';
import { MeetingController } from '../controllers/meetingController';
import { validateRequest } from '../middleware/validateRequest';
import mongoose from 'mongoose';

const router = Router({ mergeParams: true });

const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }).optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format' }).transform(val => new Date(val)),
  endTime: z.string().datetime({ message: 'Invalid end time format' }).transform(val => new Date(val)),
  attendees: z.array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid attendee ID format' })),
  meetingLink: z.string().url('Invalid meeting link').max(500, 'Link is too long').optional(),
});

const updateMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional(),
  projectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }).nullable().optional(),
  startTime: z.string().datetime({ message: 'Invalid start time format' }).transform(val => val ? new Date(val) : undefined).optional(),
  endTime: z.string().datetime({ message: 'Invalid end time format' }).transform(val => val ? new Date(val) : undefined).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  attendees: z.array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid attendee ID format' })).optional(),
  meetingLink: z.string().url('Invalid meeting link').max(500, 'Link is too long').nullable().optional(),
});

const meetingIdParamSchema = z.object({
  workspaceId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
  meetingId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), { message: 'Invalid meeting ID format' }).optional(),
});

router.post('/', validateRequest({ params: meetingIdParamSchema, body: createMeetingSchema }), MeetingController.create);
router.get('/', validateRequest({ params: meetingIdParamSchema }), MeetingController.list);
router.get('/:meetingId', validateRequest({ params: meetingIdParamSchema }), MeetingController.getById);
router.patch('/:meetingId', validateRequest({ params: meetingIdParamSchema, body: updateMeetingSchema }), MeetingController.update);
router.delete('/:meetingId', validateRequest({ params: meetingIdParamSchema }), MeetingController.delete);

export default router;
