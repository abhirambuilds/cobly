"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const PORT = config_1.config.port;
const startServer = async () => {
    // Connect to Database first
    await (0, database_1.connectDatabase)();
    const server = app_1.default.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT}`);
    });
    // Graceful shutdown handling
    const shutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            console.log('[Server] HTTP server closed');
            await (0, database_1.disconnectDatabase)();
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
};
startServer();
