"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const User_1 = __importDefault(require("../models/User"));
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                res.status(401).json({ error: { message: 'Authentication required' } });
                return;
            }
            const user = await User_1.default.findById(req.user.id);
            if (!user) {
                res.status(401).json({ error: { message: 'User not found' } });
                return;
            }
            if (!roles.includes(user.role)) {
                res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
                return;
            }
            // Optionally attach full user to req if downstream needs it, 
            // but for strict authorization separation, we just authorize here.
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
