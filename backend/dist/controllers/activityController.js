"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const activityService_1 = require("../services/activityService");
class ActivityController {
    static handleServiceError(error, res, next) {
        if (error instanceof Error && error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error instanceof Error && error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
            return;
        }
        next(error);
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const activities = await activityService_1.ActivityService.getWorkspaceActivity(workspaceId, req.user.id);
            res.status(200).json({ activities });
        }
        catch (error) {
            ActivityController.handleServiceError(error, res, next);
        }
    }
}
exports.ActivityController = ActivityController;
