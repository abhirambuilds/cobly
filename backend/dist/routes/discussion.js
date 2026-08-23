"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const discussionController_1 = require("../controllers/discussionController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)({ mergeParams: true });
const createDiscussionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    content: zod_1.z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
});
const updateDiscussionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
    content: zod_1.z.string().min(1, 'Content is required').max(5000, 'Content is too long').optional(),
});
const discussionIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid project ID format',
    }),
    discussionId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid discussion ID format',
    }),
});
const projectIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid project ID format',
    }),
});
router.post('/', (0, validateRequest_1.validateRequest)({ params: projectIdParamSchema, body: createDiscussionSchema }), discussionController_1.DiscussionController.create);
router.get('/', (0, validateRequest_1.validateRequest)({ params: projectIdParamSchema }), discussionController_1.DiscussionController.list);
router.get('/:discussionId', (0, validateRequest_1.validateRequest)({ params: discussionIdParamSchema }), discussionController_1.DiscussionController.getById);
router.patch('/:discussionId', (0, validateRequest_1.validateRequest)({ params: discussionIdParamSchema, body: updateDiscussionSchema }), discussionController_1.DiscussionController.update);
router.delete('/:discussionId', (0, validateRequest_1.validateRequest)({ params: discussionIdParamSchema }), discussionController_1.DiscussionController.delete);
exports.default = router;
