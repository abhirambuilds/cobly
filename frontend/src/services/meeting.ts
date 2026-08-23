import { api } from './api';
import type { MeetingResponse, MeetingsResponse, CreateMeetingRequest, UpdateMeetingRequest } from '../types/meeting';

export const meetingApi = {
  list: async (workspaceId: string): Promise<MeetingsResponse> => {
    return api.get(`/workspaces/${workspaceId}/meetings`);
  },
  
  get: async (workspaceId: string, meetingId: string): Promise<MeetingResponse> => {
    return api.get(`/workspaces/${workspaceId}/meetings/${meetingId}`);
  },
  
  create: async (workspaceId: string, data: CreateMeetingRequest): Promise<MeetingResponse> => {
    return api.post(`/workspaces/${workspaceId}/meetings`, data);
  },
  
  update: async (workspaceId: string, meetingId: string, data: UpdateMeetingRequest): Promise<MeetingResponse> => {
    return api.patch(`/workspaces/${workspaceId}/meetings/${meetingId}`, data);
  },
  
  delete: async (workspaceId: string, meetingId: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${workspaceId}/meetings/${meetingId}`);
  }
};
