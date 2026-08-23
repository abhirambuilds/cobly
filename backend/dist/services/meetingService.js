"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Meeting_1 = __importDefault(require("../models/Meeting"));
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const activityService_1 = require("./activityService");
class MeetingService {
    static toSafeMeeting(meeting) {
        const toSafeUser = (u) => {
            if (u && typeof u === 'object' && '_id' in u) {
                return { id: u._id.toString(), name: u.name, email: u.email };
            }
            return { id: u?.toString() || '', name: 'Unknown', email: 'Unknown' };
        };
        return {
            id: meeting._id.toString(),
            workspaceId: meeting.workspaceId.toString(),
            projectId: meeting.projectId?.toString(),
            organizer: toSafeUser(meeting.organizer),
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            status: meeting.status,
            attendees: meeting.attendees.map(toSafeUser),
            meetingLink: meeting.meetingLink,
            createdAt: meeting.createdAt,
            updatedAt: meeting.updatedAt,
        };
    }
    static async getContext(workspaceId, userId, projectId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('WORKSPACE_NOT_FOUND');
        const member = workspace.members.find(m => m.user.toString() === userId);
        let project = null;
        if (projectId) {
            project = await Project_1.default.findOne({
                _id: new mongoose_1.default.Types.ObjectId(projectId),
                workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
            });
            if (!project)
                throw new Error('PROJECT_NOT_FOUND');
        }
        return {
            isWorkspaceMember: !!member,
            isWorkspaceOwner: member?.role === 'owner',
            workspace,
            project
        };
    }
    static validateAttendees(attendeesIds, workspace) {
        const uniqueAttendees = [...new Set(attendeesIds)];
        for (const id of uniqueAttendees) {
            const isMember = workspace.members.some((m) => m.user.toString() === id);
            if (!isMember) {
                throw new Error('INVALID_ATTENDEE');
            }
        }
        return uniqueAttendees.map(id => new mongoose_1.default.Types.ObjectId(id));
    }
    static async createMeeting(workspaceId, userId, data) {
        const context = await this.getContext(workspaceId, userId, data.projectId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        if (data.endTime <= data.startTime) {
            throw new Error('INVALID_TIME');
        }
        let attendeeIds = data.attendees;
        if (!attendeeIds.includes(userId)) {
            attendeeIds.push(userId); // Ensure organizer is an attendee
        }
        const validatedAttendees = this.validateAttendees(attendeeIds, context.workspace);
        const meeting = new Meeting_1.default({
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            projectId: data.projectId ? new mongoose_1.default.Types.ObjectId(data.projectId) : undefined,
            organizer: new mongoose_1.default.Types.ObjectId(userId),
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
            attendees: validatedAttendees,
            meetingLink: data.meetingLink,
            status: 'scheduled'
        });
        await meeting.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId,
            actorId: userId,
            action: 'meeting_created',
            entityType: 'meeting',
            entityId: meeting._id.toString(),
            metadata: { title: meeting.title }
        });
        const { NotificationService } = await import('./notificationService.js');
        for (const attendee of validatedAttendees) {
            if (attendee.toString() !== userId) {
                await NotificationService.sendNotification({
                    recipientId: attendee.toString(),
                    workspaceId,
                    type: 'meeting_created',
                    title: 'Meeting Scheduled',
                    message: `You were invited to meeting: ${meeting.title}`,
                    entityType: 'meeting',
                    entityId: meeting._id.toString()
                });
            }
        }
        await meeting.populate('organizer', 'name email');
        await meeting.populate('attendees', 'name email');
        return this.toSafeMeeting(meeting);
    }
    static async getMeetings(workspaceId, userId, filters) {
        const context = await this.getContext(workspaceId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const query = { workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) };
        if (filters?.status)
            query.status = filters.status;
        if (filters?.projectId)
            query.projectId = new mongoose_1.default.Types.ObjectId(filters.projectId);
        const meetings = await Meeting_1.default.find(query)
            .sort({ startTime: 1 })
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        return meetings.map(m => this.toSafeMeeting(m));
    }
    static async getMeetingById(workspaceId, meetingId, userId) {
        const context = await this.getContext(workspaceId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const meeting = await Meeting_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(meetingId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        })
            .populate('organizer', 'name email')
            .populate('attendees', 'name email');
        if (!meeting) {
            throw new Error('MEETING_NOT_FOUND');
        }
        return this.toSafeMeeting(meeting);
    }
    static async updateMeeting(workspaceId, meetingId, userId, data) {
        let context = await this.getContext(workspaceId, userId, data.projectId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const meeting = await Meeting_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(meetingId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!meeting) {
            throw new Error('MEETING_NOT_FOUND');
        }
        const isOrganizer = meeting.organizer.toString() === userId;
        if (!isOrganizer && !context.isWorkspaceOwner) {
            throw new Error('FORBIDDEN');
        }
        const changes = {};
        if (data.title !== undefined) {
            meeting.title = data.title;
            changes.title = true;
        }
        if (data.description !== undefined) {
            meeting.description = data.description;
        }
        if (data.projectId !== undefined) {
            meeting.projectId = data.projectId ? new mongoose_1.default.Types.ObjectId(data.projectId) : undefined;
            changes.projectId = true;
        }
        if (data.startTime !== undefined) {
            meeting.startTime = data.startTime;
            changes.startTime = true;
        }
        if (data.endTime !== undefined) {
            meeting.endTime = data.endTime;
            changes.endTime = true;
        }
        if (meeting.endTime <= meeting.startTime) {
            throw new Error('INVALID_TIME');
        }
        if (data.status !== undefined) {
            meeting.status = data.status;
            changes.status = data.status;
        }
        if (data.attendees !== undefined) {
            let attendeeIds = data.attendees;
            if (!attendeeIds.includes(meeting.organizer.toString())) {
                attendeeIds.push(meeting.organizer.toString());
            }
            meeting.attendees = this.validateAttendees(attendeeIds, context.workspace);
            changes.attendees = true;
        }
        if (data.meetingLink !== undefined) {
            meeting.meetingLink = data.meetingLink;
        }
        await meeting.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId,
            actorId: userId,
            action: 'meeting_updated',
            entityType: 'meeting',
            entityId: meeting._id.toString(),
            metadata: changes
        });
        const { NotificationService } = await import('./notificationService.js');
        for (const attendee of meeting.attendees) {
            if (attendee.toString() !== userId) {
                if (data.status === 'cancelled') {
                    await NotificationService.sendNotification({
                        recipientId: attendee.toString(),
                        workspaceId,
                        type: 'meeting_cancelled',
                        title: 'Meeting Cancelled',
                        message: `Meeting cancelled: ${meeting.title}`,
                        entityType: 'meeting',
                        entityId: meeting._id.toString()
                    });
                }
                else {
                    await NotificationService.sendNotification({
                        recipientId: attendee.toString(),
                        workspaceId,
                        type: 'meeting_updated',
                        title: 'Meeting Updated',
                        message: `Meeting updated: ${meeting.title}`,
                        entityType: 'meeting',
                        entityId: meeting._id.toString()
                    });
                }
            }
        }
        await meeting.populate('organizer', 'name email');
        await meeting.populate('attendees', 'name email');
        return this.toSafeMeeting(meeting);
    }
    static async deleteMeeting(workspaceId, meetingId, userId) {
        const context = await this.getContext(workspaceId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const meeting = await Meeting_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(meetingId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!meeting) {
            throw new Error('MEETING_NOT_FOUND');
        }
        const isOrganizer = meeting.organizer.toString() === userId;
        if (!isOrganizer && !context.isWorkspaceOwner) {
            throw new Error('FORBIDDEN');
        }
        await Meeting_1.default.deleteOne({ _id: meeting._id });
        await activityService_1.ActivityService.recordActivity({
            workspaceId,
            actorId: userId,
            action: 'meeting_deleted',
            entityType: 'meeting',
            entityId: meeting._id.toString(),
            metadata: { title: meeting.title }
        });
    }
}
exports.MeetingService = MeetingService;
