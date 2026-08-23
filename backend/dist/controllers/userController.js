"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
class UserController {
    /**
     * Retrieves the currently authenticated user's profile based on the JWT context.
     */
    static async getMe(req, res, next) {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: { message: 'Authentication required' } });
                return;
            }
            const safeProfile = await userService_1.UserService.getUserProfile(req.user.id);
            res.status(200).json({ user: safeProfile });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
                res.status(404).json({ error: { message: 'User profile not found' } });
                return;
            }
            next(error);
        }
    }
}
exports.UserController = UserController;
