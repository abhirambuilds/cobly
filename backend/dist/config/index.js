"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing or insecurely short (must be at least 32 characters).');
    process.exit(1);
}
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cobly',
    jwtSecret: jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
};
