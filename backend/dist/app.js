"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const routes_1 = __importDefault(require("./routes"));
const config_1 = require("./config");
const app = (0, express_1.default)();
// Security: Trust Proxy (useful if behind a reverse proxy like Nginx, AWS ELB, etc.)
if (config_1.config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
}
// Security: Helmet for secure HTTP headers
app.use((0, helmet_1.default)());
// Security: CORS Configuration
const corsOptions = {
    origin: config_1.config.nodeEnv === 'production' ? config_1.config.frontendUrl : '*',
    credentials: true, // Allow cookies/auth headers if needed by the frontend
};
app.use((0, cors_1.default)(corsOptions));
// Security: General API Rate Limiting (in-memory store, not suitable for multi-instance without Redis)
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config_1.config.nodeEnv === 'test' ? 10000 : 500, // Limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
// Apply general rate limiter to all /api routes
app.use('/api', apiLimiter);
// Middleware: Request Logger
app.use(logger_1.requestLogger);
// Middleware: JSON Body Parser with explicit size limit to prevent large payload attacks
app.use(express_1.default.json({ limit: '100kb' }));
// API Routes
app.use('/api', routes_1.default);
// Middleware: 404 Not Found Handler
app.use(notFoundHandler_1.notFoundHandler);
// Middleware: Error Handler (must be registered last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
