import mongoose from 'mongoose';
import Meeting, { IMeeting } from '../models/Meeting';
import Project from '../models/Project';
import Workspace from '../models/Workspace';
import { IUser } from '../models/User';
import { ActivityService } from './activityService';

export interface SafeMeeting {
  id: string;
  workspaceId: string;
  projectId?: string;
  organizer: { id: string; name: string; email: string };
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  attendees: { id: string; name: string; email: string }[];
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MeetingService {
  static toSafeMeeting(meeting: IMeeting): SafeMeeting {
    const toSafeUser = (u: unknown): { id: string; name: string; email: string } => {
      if (u && typeof u === 'object' && '_id' in u) {
        const user = u as unknown as IUser;
        return { id: user._id.toString(), name: user.name, email: user.email };
      }
      return { id: u ? String(u) : '', name: 'Unknown', email: 'Unknown' };
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

  private static async getContext(workspaceId: string, userId: string, projectId?: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');

    const member = workspace.members.find(m => m.user.toString() === userId);
    
    let project = null;
    if (projectId) {
      project = await Project.findOne({ 
        _id: new mongoose.Types.ObjectId(projectId), 
        workspaceId: new mongoose.Types.ObjectId(workspaceId) 
      });
      if (!project) throw new Error('PROJECT_NOT_FOUND');
    }

    return {
      isWorkspaceMember: !!member,
      isWorkspaceOwner: member?.role === 'owner',
      workspace,
      project
    };
  }

  private static validateAttendees(attendeesIds: string[], workspace: { members: Array<{ user: { toString: () => string } }> }) {
    const uniqueAttendees = [...new Set(attendeesIds)];
    for (const id of uniqueAttendees) {
      const isMember = workspace.members.some((m) => m.user.toString() === id);
      if (!isMember) {
        throw new Error('INVALID_ATTENDEE');
      }
    }
    return uniqueAttendees.map(id => new mongoose.Types.ObjectId(id));
  }

  static async createMeeting(
    workspaceId: string, 
    userId: string, 
    data: {
      title: string;
      description?: string;
      projectId?: string;
      startTime: Date;
      endTime: Date;
      attendees: string[];
      meetingLink?: string;
    }
  ): Promise<SafeMeeting> {
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

    const meeting = new Meeting({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : undefined,
      organizer: new mongoose.Types.ObjectId(userId),
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees: validatedAttendees,
      meetingLink: data.meetingLink,
      status: 'scheduled'
    });

    await meeting.save();
    
    await ActivityService.recordActivity({
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

  static async getMeetings(workspaceId: string, userId: string, filters?: { status?: string, projectId?: string }): Promise<SafeMeeting[]> {
    const context = await this.getContext(workspaceId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const query: Record<string, unknown> = { workspaceId: new mongoose.Types.ObjectId(workspaceId) };
    if (filters?.status) query.status = filters.status;
    if (filters?.projectId) query.projectId = new mongoose.Types.ObjectId(filters.projectId);

    const meetings = await Meeting.find(query)
      .sort({ startTime: 1 })
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    return meetings.map(m => this.toSafeMeeting(m));
  }

  static async getMeetingById(workspaceId: string, meetingId: string, userId: string): Promise<SafeMeeting> {
    const context = await this.getContext(workspaceId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const meeting = await Meeting.findOne({
      _id: new mongoose.Types.ObjectId(meetingId),
      workspaceId: new mongoose.Types.ObjectId(workspaceId)
    })
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    return this.toSafeMeeting(meeting);
  }

  static async updateMeeting(
    workspaceId: string, 
    meetingId: string,
    userId: string, 
    data: {
      title?: string;
      description?: string;
      projectId?: string;
      startTime?: Date;
      endTime?: Date;
      status?: 'scheduled' | 'completed' | 'cancelled';
      attendees?: string[];
      meetingLink?: string;
    }
  ): Promise<SafeMeeting> {
    let context = await this.getContext(workspaceId, userId, data.projectId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const meeting = await Meeting.findOne({
      _id: new mongoose.Types.ObjectId(meetingId),
      workspaceId: new mongoose.Types.ObjectId(workspaceId)
    });

    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const isOrganizer = meeting.organizer.toString() === userId;
    if (!isOrganizer && !context.isWorkspaceOwner) {
      throw new Error('FORBIDDEN');
    }

    const changes: Record<string, unknown> = {};
    if (data.title !== undefined) { meeting.title = data.title; changes.title = true; }
    if (data.description !== undefined) { meeting.description = data.description; }
    
    if (data.projectId !== undefined) {
      meeting.projectId = data.projectId ? new mongoose.Types.ObjectId(data.projectId) : undefined;
      changes.projectId = true;
    }

    if (data.startTime !== undefined) { meeting.startTime = data.startTime; changes.startTime = true; }
    if (data.endTime !== undefined) { meeting.endTime = data.endTime; changes.endTime = true; }
    if (meeting.endTime <= meeting.startTime) {
      throw new Error('INVALID_TIME');
    }

    if (data.status !== undefined) { meeting.status = data.status; changes.status = data.status; }
    
    if (data.attendees !== undefined) {
      let attendeeIds = data.attendees;
      if (!attendeeIds.includes(meeting.organizer.toString())) {
        attendeeIds.push(meeting.organizer.toString());
      }
      meeting.attendees = this.validateAttendees(attendeeIds, context.workspace);
      changes.attendees = true;
    }

    if (data.meetingLink !== undefined) { meeting.meetingLink = data.meetingLink; }

    await meeting.save();
    
    await ActivityService.recordActivity({
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
        } else {
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

  static async deleteMeeting(workspaceId: string, meetingId: string, userId: string): Promise<void> {
    const context = await this.getContext(workspaceId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const meeting = await Meeting.findOne({
      _id: new mongoose.Types.ObjectId(meetingId),
      workspaceId: new mongoose.Types.ObjectId(workspaceId)
    });

    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const isOrganizer = meeting.organizer.toString() === userId;
    if (!isOrganizer && !context.isWorkspaceOwner) {
      throw new Error('FORBIDDEN');
    }

    await Meeting.deleteOne({ _id: meeting._id });

    await ActivityService.recordActivity({
      workspaceId,
      actorId: userId,
      action: 'meeting_deleted',
      entityType: 'meeting',
      entityId: meeting._id.toString(),
      metadata: { title: meeting.title }
    });
  }
}
