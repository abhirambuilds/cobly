"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const config_1 = require("../config");
class AuthService {
    static async registerUser(name, email, passwordPlain) {
        const existingUser = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('DUPLICATE_EMAIL');
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(passwordPlain, salt);
        const user = new User_1.default({
            name,
            email: email.toLowerCase(),
            passwordHash,
        });
        await user.save();
        return user;
    }
    static async loginUser(email, passwordPlain) {
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const isMatch = await bcrypt_1.default.compare(passwordPlain, user.passwordHash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
        return { user, token };
    }
}
exports.AuthService = AuthService;
