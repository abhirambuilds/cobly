"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const projectController_1 = require("../controllers/projectController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
// mergeParams: true allows us to access req.params.workspaceId from the parent router
const router = (0, express_1.Router)({ mergeParams: true });
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
    status: zod_1.z.enum(['planned', 'active', 'completed', 'archived']).optional(),
    deadline: zod_1.z.string().datetime({ message: 'Invalid deadline format' }).optional().transform(val => val ? new Date(val) : undefined),
});
const updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required').max(100, 'Name is too long').optional(),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
    status: zod_1.z.enum(['planned', 'active', 'completed', 'archived']).optional(),
    deadline: zod_1.z.string().datetime({ message: 'Invalid deadline format' }).optional().transform(val => val ? new Date(val) : undefined),
});
const projectIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid project ID format',
    }),
});
const workspaceIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
});
router.post('/', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema, body: createProjectSchema }), projectController_1.ProjectController.create);
router.get('/', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema }), projectController_1.ProjectController.list);
router.get('/:projectId', (0, validateRequest_1.validateRequest)({ params: projectIdParamSchema }), projectController_1.ProjectController.getById);
router.patch('/:projectId', (0, validateRequest_1.validateRequest)({ params: projectIdParamSchema, body: updateProjectSchema }), projectController_1.ProjectController.update);
router.delete('/:projectId', (0, validateRequest_1.validateRequest)({ params: projectIdParamSchema }), projectController_1.ProjectController.delete);
exports.default = router;
