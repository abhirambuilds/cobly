"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const taskController_1 = require("../controllers/taskController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
// mergeParams: true allows us to access req.params.workspaceId and req.params.projectId
const router = (0, express_1.Router)({ mergeParams: true });
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required').max(200, 'Title is too long'),
    description: zod_1.z.string().max(2000, 'Description is too long').optional(),
    assignee: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid assignee ID format',
    }).nullable().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'completed']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    dueDate: zod_1.z.string().datetime({ message: 'Invalid due date format' }).optional().transform(val => val ? new Date(val) : undefined),
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required').max(200, 'Title is too long').optional(),
    description: zod_1.z.string().max(2000, 'Description is too long').optional(),
    assignee: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid assignee ID format',
    }).nullable().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'completed']).optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    dueDate: zod_1.z.string().datetime({ message: 'Invalid due date format' }).optional().transform(val => val ? new Date(val) : undefined),
});
const taskParamsSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid project ID format',
    }),
    taskId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid task ID format',
    }).optional(), // Optional so the same schema can be used for list/create
});
const taskIdParamSchema = taskParamsSchema.extend({
    taskId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid task ID format',
    }),
});
router.post('/', (0, validateRequest_1.validateRequest)({ params: taskParamsSchema, body: createTaskSchema }), taskController_1.TaskController.create);
router.get('/', (0, validateRequest_1.validateRequest)({ params: taskParamsSchema }), taskController_1.TaskController.list);
router.get('/:taskId', (0, validateRequest_1.validateRequest)({ params: taskIdParamSchema }), taskController_1.TaskController.getById);
router.patch('/:taskId', (0, validateRequest_1.validateRequest)({ params: taskIdParamSchema, body: updateTaskSchema }), taskController_1.TaskController.update);
router.delete('/:taskId', (0, validateRequest_1.validateRequest)({ params: taskIdParamSchema }), taskController_1.TaskController.delete);
exports.default = router;
