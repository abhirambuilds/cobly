"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStatus = mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    const isHealthy = mongoose_1.default.connection.readyState === 1;
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'error',
        service: 'cobly-api',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
