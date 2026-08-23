"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const activityController_1 = require("../controllers/activityController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)({ mergeParams: true });
const workspaceIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid workspace ID format',
    }),
});
router.get('/', (0, validateRequest_1.validateRequest)({ params: workspaceIdParamSchema }), activityController_1.ActivityController.list);
exports.default = router;
