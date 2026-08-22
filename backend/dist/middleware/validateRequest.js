"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schemas) => {
    return async (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                req.query = (await schemas.query.parseAsync(req.query));
            }
            if (schemas.params) {
                req.params = (await schemas.params.parseAsync(req.params));
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: {
                        message: 'Validation failed',
                        details: error.issues.map((err) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
