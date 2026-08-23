"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const workspace_1 = __importDefault(require("./workspace"));
const notification_1 = __importDefault(require("./notification"));
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// Mount all API routes here
router.use('/health', health_1.default);
router.use('/auth', auth_1.default);
router.use('/users', user_1.default);
router.use('/workspaces', workspace_1.default);
router.use('/notifications', requireAuth_1.requireAuth, notification_1.default);
exports.default = router;
