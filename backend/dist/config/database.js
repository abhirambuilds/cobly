"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(index_1.config.mongodbUri);
        console.log(`[Database] Connected successfully to MongoDB`);
    }
    catch (error) {
        console.error(`[Database] Connection failed:`, error);
        process.exit(1); // Fail startup if DB is unreachable
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log(`[Database] Disconnected successfully`);
    }
    catch (error) {
        console.error(`[Database] Disconnect failed:`, error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
