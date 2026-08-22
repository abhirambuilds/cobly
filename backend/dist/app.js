"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Middleware: Request Logger
app.use(logger_1.requestLogger);
// Middleware: JSON Body Parser
app.use(express_1.default.json());
// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cobly backend is running' });
});
// Middleware: Error Handler (must be registered last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
