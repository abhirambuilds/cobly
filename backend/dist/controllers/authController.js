"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    static async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const user = await authService_1.AuthService.registerUser(name, email, password);
            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        }
        catch (error) {
            if (error.message === 'DUPLICATE_EMAIL') {
                res.status(409).json({ error: { message: 'Email already exists' } });
                return;
            }
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { user, token } = await authService_1.AuthService.loginUser(email, password);
            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        }
        catch (error) {
            if (error.message === 'INVALID_CREDENTIALS') {
                res.status(401).json({ error: { message: 'Invalid credentials' } });
                return;
            }
            next(error);
        }
    }
}
exports.AuthController = AuthController;
