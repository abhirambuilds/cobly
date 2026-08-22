"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Middleware: Request Logger
app.use(logger_1.requestLogger);
// Middleware: JSON Body Parser
app.use(express_1.default.json());
// API Routes
app.use('/api', routes_1.default);
// Middleware: 404 Not Found Handler
app.use(notFoundHandler_1.notFoundHandler);
// Middleware: Error Handler (must be registered last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
