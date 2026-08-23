"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const workspaceController_1 = require("../controllers/workspaceController");
const requireAuth_1 = require("../middleware/requireAuth");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const project_1 = __importDefault(require("./project"));
const activity_1 = __importDefault(require("./activity"));
const router = (0, express_1.Router)();
// ... existing schemas ...
const createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workspace name is required').max(100, 'Name is too long'),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
});
const updateWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Workspace name is required').max(100, 'Name is too long').optional(),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
});
const workspaceIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
});
router.use(requireAuth_1.requireAuth);
router.post('/', (0, validateRequest_1.validateRequest)({ body: createWorkspaceSchema }), workspaceController_1.WorkspaceController.create);
router.get('/', workspaceController_1.WorkspaceController.list);
router.get('/:workspaceId', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema }), workspaceController_1.WorkspaceController.getById);
router.patch('/:workspaceId', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }), workspaceController_1.WorkspaceController.update);
router.delete('/:workspaceId', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema }), workspaceController_1.WorkspaceController.delete);
// Mount nested routes
router.use('/:workspaceId/projects', project_1.default);
router.use('/:workspaceId/activity', activity_1.default);
exports.default = router;
