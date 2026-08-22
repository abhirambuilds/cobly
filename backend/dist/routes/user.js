"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// Retrieve the currently authenticated user's profile
router.get('/me', requireAuth_1.requireAuth, userController_1.UserController.getMe);
exports.default = router;
