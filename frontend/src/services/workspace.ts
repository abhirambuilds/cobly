import { api } from './api';
import type {
  WorkspaceResponse,
  WorkspacesResponse,
  MembersResponse,
} from '../types/workspace';



export const workspaceApi = {
  list: async (): Promise<WorkspacesResponse> => {
    return api.get('/workspaces');
  },

  get: async (id: string): Promise<WorkspaceResponse> => {
    return api.get(`/workspaces/${id}`);
  },

  create: async (data: { name: string; description?: string }): Promise<WorkspaceResponse> => {
    return api.post('/workspaces', data);
  },

  update: async (id: string, data: { name?: string; description?: string }): Promise<WorkspaceResponse> => {
    return api.patch(`/workspaces/${id}`, data);
  },
  
  delete: async (id: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${id}`);
  },

  getMembers: async (workspaceId: string): Promise<MembersResponse> => {
    return api.get(`/workspaces/${workspaceId}/members`);
  },

  addMember: async (workspaceId: string, email: string): Promise<{ message: string }> => {
    return api.post(`/workspaces/${workspaceId}/members`, { email });
  },

  removeMember: async (workspaceId: string, userId: string): Promise<{ message: string }> => {
    return api.del(`/workspaces/${workspaceId}/members/${userId}`);
  }
};
