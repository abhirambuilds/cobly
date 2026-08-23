"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const notificationController_1 = require("../controllers/notificationController");
const validateRequest_1 = require("../middleware/validateRequest");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
const notificationIdParamSchema = zod_1.z.object({
    notificationId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid notification ID format',
    }),
});
router.get('/', notificationController_1.NotificationController.list);
router.patch('/read-all', notificationController_1.NotificationController.markAllAsRead);
router.patch('/:notificationId/read', (0, validateRequest_1.validateRequest)({ params: notificationIdParamSchema }), notificationController_1.NotificationController.markAsRead);
router.delete('/:notificationId', (0, validateRequest_1.validateRequest)({ params: notificationIdParamSchema }), notificationController_1.NotificationController.delete);
exports.default = router;
