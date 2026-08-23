"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const meetingController_1 = require("../controllers/meetingController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)({ mergeParams: true });
const createMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: zod_1.z.string().max(2000, 'Description is too long').optional(),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }).optional(),
    startTime: zod_1.z.string().datetime({ message: 'Invalid start time format' }).transform(val => new Date(val)),
    endTime: zod_1.z.string().datetime({ message: 'Invalid end time format' }).transform(val => new Date(val)),
    attendees: zod_1.z.array(zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid attendee ID format' })),
    meetingLink: zod_1.z.string().url('Invalid meeting link').max(500, 'Link is too long').optional(),
});
const updateMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
    description: zod_1.z.string().max(2000, 'Description is too long').optional(),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }).nullable().optional(),
    startTime: zod_1.z.string().datetime({ message: 'Invalid start time format' }).transform(val => val ? new Date(val) : undefined).optional(),
    endTime: zod_1.z.string().datetime({ message: 'Invalid end time format' }).transform(val => val ? new Date(val) : undefined).optional(),
    status: zod_1.z.enum(['scheduled', 'completed', 'cancelled']).optional(),
    attendees: zod_1.z.array(zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid attendee ID format' })).optional(),
    meetingLink: zod_1.z.string().url('Invalid meeting link').max(500, 'Link is too long').nullable().optional(),
});
const meetingIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
    meetingId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid meeting ID format' }).optional(),
});
router.post('/', (0, validateRequest_1.validateRequest)({ params: meetingIdParamSchema, body: createMeetingSchema }), meetingController_1.MeetingController.create);
router.get('/', (0, validateRequest_1.validateRequest)({ params: meetingIdParamSchema }), meetingController_1.MeetingController.list);
router.get('/:meetingId', (0, validateRequest_1.validateRequest)({ params: meetingIdParamSchema }), meetingController_1.MeetingController.getById);
router.patch('/:meetingId', (0, validateRequest_1.validateRequest)({ params: meetingIdParamSchema, body: updateMeetingSchema }), meetingController_1.MeetingController.update);
router.delete('/:meetingId', (0, validateRequest_1.validateRequest)({ params: meetingIdParamSchema }), meetingController_1.MeetingController.delete);
exports.default = router;
