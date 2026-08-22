"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = __importDefault(require("../models/User"));
class UserService {
    /**
     * Converts a Mongoose IUser document into a safe API representation,
     * stripping out sensitive fields like passwordHash.
     */
    static toSafeUser(user) {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    /**
     * Retrieves a user by ID and returns their safe profile.
     */
    static async getUserProfile(userId) {
        const user = await User_1.default.findById(userId);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        return this.toSafeUser(user);
    }
}
exports.UserService = UserService;
