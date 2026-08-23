"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const commentController_1 = require("../controllers/commentController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)({ mergeParams: true });
const createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content is required').max(5000, 'Content is too long'),
});
const updateCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content is required').max(5000, 'Content is too long').optional(),
});
const discussionIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }),
    discussionId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid discussion ID format' }),
});
const commentIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid workspace ID format' }),
    projectId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid project ID format' }),
    discussionId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid discussion ID format' }),
    commentId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), { message: 'Invalid comment ID format' }),
});
router.post('/', (0, validateRequest_1.validateRequest)({ params: discussionIdParamSchema, body: createCommentSchema }), commentController_1.CommentController.create);
router.get('/', (0, validateRequest_1.validateRequest)({ params: discussionIdParamSchema }), commentController_1.CommentController.list);
router.patch('/:commentId', (0, validateRequest_1.validateRequest)({ params: commentIdParamSchema, body: updateCommentSchema }), commentController_1.CommentController.update);
router.delete('/:commentId', (0, validateRequest_1.validateRequest)({ params: commentIdParamSchema }), commentController_1.CommentController.delete);
exports.default = router;
