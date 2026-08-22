"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
router.post('/register', (0, validateRequest_1.validateRequest)({ body: registerSchema }), authController_1.AuthController.register);
router.post('/login', (0, validateRequest_1.validateRequest)({ body: loginSchema }), authController_1.AuthController.login);
exports.default = router;
