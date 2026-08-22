"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: {
            message: `Route not found: ${req.originalUrl}`
        }
    });
};
exports.notFoundHandler = notFoundHandler;
