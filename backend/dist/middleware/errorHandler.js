"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // In production, do not expose internal error details for 500 errors
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage = isProduction && statusCode === 500 ? 'Internal Server Error' : message;
    console.error(`[Error] ${statusCode} - ${message}`);
    if (!isProduction && err.stack) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        error: {
            message: responseMessage,
            ...(isProduction ? {} : { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
