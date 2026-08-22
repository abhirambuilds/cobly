"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Liveness probe: checks if the application process is running
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'cobly-api',
        type: 'liveness',
        timestamp: new Date().toISOString()
    });
});
// Readiness probe: checks if the application is ready to serve traffic (e.g., DB connected)
router.get('/readiness', (req, res) => {
    // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const isHealthy = mongoose_1.default.connection.readyState === 1;
    const dbStatus = isHealthy ? 'connected' : 'disconnected';
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'error',
        service: 'cobly-api',
        type: 'readiness',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
