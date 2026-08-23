import type { User } from './auth';

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  meetingLink?: string;
  projectId?: string;
  workspaceId: string;
  organizer: string; // User ID
  attendees: User[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingsResponse {
  meetings: Meeting[];
}

export interface MeetingResponse {
  meeting: Meeting;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  projectId?: string;
  startTime: string;
  endTime: string;
  status?: MeetingStatus;
  meetingLink?: string;
  attendees: string[]; // User IDs
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  projectId?: string;
  startTime?: string;
  endTime?: string;
  status?: MeetingStatus;
  meetingLink?: string;
  attendees?: string[]; // User IDs
}
