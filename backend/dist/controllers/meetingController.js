"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingController = void 0;
const meetingService_1 = require("../services/meetingService");
class MeetingController {
    static handleServiceError(error, res, next) {
        if (error.message === 'WORKSPACE_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Workspace not found' } });
            return;
        }
        if (error.message === 'PROJECT_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Project not found' } });
            return;
        }
        if (error.message === 'MEETING_NOT_FOUND') {
            res.status(404).json({ error: { message: 'Meeting not found' } });
            return;
        }
        if (error.message === 'FORBIDDEN') {
            res.status(403).json({ error: { message: 'Forbidden: insufficient permissions' } });
            return;
        }
        if (error.message === 'INVALID_TIME') {
            res.status(400).json({ error: { message: 'End time must be after start time' } });
            return;
        }
        if (error.message === 'INVALID_ATTENDEE') {
            res.status(400).json({ error: { message: 'One or more attendees are not members of this workspace' } });
            return;
        }
        next(error);
    }
    static async create(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const { title, description, projectId, startTime, endTime, attendees, meetingLink } = req.body;
            const meeting = await meetingService_1.MeetingService.createMeeting(workspaceId, req.user.id, {
                title, description, projectId, startTime, endTime, attendees, meetingLink
            });
            res.status(201).json({ meeting });
        }
        catch (error) {
            MeetingController.handleServiceError(error, res, next);
        }
    }
    static async list(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const status = req.query.status;
            const projectId = req.query.projectId;
            const meetings = await meetingService_1.MeetingService.getMeetings(workspaceId, req.user.id, { status, projectId });
            res.status(200).json({ meetings });
        }
        catch (error) {
            MeetingController.handleServiceError(error, res, next);
        }
    }
    static async getById(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const meetingId = req.params.meetingId;
            const meeting = await meetingService_1.MeetingService.getMeetingById(workspaceId, meetingId, req.user.id);
            res.status(200).json({ meeting });
        }
        catch (error) {
            MeetingController.handleServiceError(error, res, next);
        }
    }
    static async update(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const meetingId = req.params.meetingId;
            const { title, description, projectId, startTime, endTime, status, attendees, meetingLink } = req.body;
            const meeting = await meetingService_1.MeetingService.updateMeeting(workspaceId, meetingId, req.user.id, {
                title, description, projectId, startTime, endTime, status, attendees, meetingLink
            });
            res.status(200).json({ meeting });
        }
        catch (error) {
            MeetingController.handleServiceError(error, res, next);
        }
    }
    static async delete(req, res, next) {
        try {
            const workspaceId = req.params.workspaceId;
            const meetingId = req.params.meetingId;
            await meetingService_1.MeetingService.deleteMeeting(workspaceId, meetingId, req.user.id);
            res.status(200).json({ success: true, message: 'Meeting deleted' });
        }
        catch (error) {
            MeetingController.handleServiceError(error, res, next);
        }
    }
}
exports.MeetingController = MeetingController;
