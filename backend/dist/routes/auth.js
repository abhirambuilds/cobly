"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middleware/validateRequest");
const config_1 = require("../config");
const router = (0, express_1.Router)();
// Security: Auth specific rate limiter (stricter to prevent brute force)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.config.nodeEnv === 'test' ? 1000 : 20, // Limit each IP to 20 auth requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many authentication attempts, please try again after 15 minutes' } }
});
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
router.post('/register', authLimiter, (0, validateRequest_1.validateRequest)({ body: registerSchema }), authController_1.AuthController.register);
router.post('/login', authLimiter, (0, validateRequest_1.validateRequest)({ body: loginSchema }), authController_1.AuthController.login);
exports.default = router;
