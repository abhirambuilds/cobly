import { Request, Response, NextFunction } from 'express';
import { MeetingService } from '../services/meetingService';

export class MeetingController {
  private static handleServiceError(error: any, res: Response, next: NextFunction) {
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

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { title, description, projectId, startTime, endTime, attendees, meetingLink } = req.body;
      
      const meeting = await MeetingService.createMeeting(workspaceId, req.user!.id, {
        title, description, projectId, startTime, endTime, attendees, meetingLink
      });
      res.status(201).json({ meeting });
    } catch (error) {
      MeetingController.handleServiceError(error, res, next);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const status = req.query.status as string | undefined;
      const projectId = req.query.projectId as string | undefined;

      const meetings = await MeetingService.getMeetings(workspaceId, req.user!.id, { status, projectId });
      res.status(200).json({ meetings });
    } catch (error) {
      MeetingController.handleServiceError(error, res, next);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const meetingId = req.params.meetingId as string;

      const meeting = await MeetingService.getMeetingById(workspaceId, meetingId, req.user!.id);
      res.status(200).json({ meeting });
    } catch (error) {
      MeetingController.handleServiceError(error, res, next);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const meetingId = req.params.meetingId as string;
      const { title, description, projectId, startTime, endTime, status, attendees, meetingLink } = req.body;
      
      const meeting = await MeetingService.updateMeeting(workspaceId, meetingId, req.user!.id, {
        title, description, projectId, startTime, endTime, status, attendees, meetingLink
      });
      res.status(200).json({ meeting });
    } catch (error) {
      MeetingController.handleServiceError(error, res, next);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.params.workspaceId as string;
      const meetingId = req.params.meetingId as string;
      
      await MeetingService.deleteMeeting(workspaceId, meetingId, req.user!.id);
      res.status(200).json({ success: true, message: 'Meeting deleted' });
    } catch (error) {
      MeetingController.handleServiceError(error, res, next);
    }
  }
}
