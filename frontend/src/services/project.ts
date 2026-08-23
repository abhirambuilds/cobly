import { api } from './api';
import type { ProjectResponse, ProjectsResponse } from '../types/project';

export const projectApi = {
  list: async (workspaceId: string): Promise<ProjectsResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects`);
  },
  
  get: async (workspaceId: string, projectId: string): Promise<ProjectResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}`);
  },
  
  create: async (workspaceId: string, data: { name: string; description?: string; status?: string; deadline?: string }): Promise<ProjectResponse> => {
    return api.post(`/workspaces/${workspaceId}/projects`, data);
  },
  
  update: async (workspaceId: string, projectId: string, data: { name?: string; description?: string; status?: string; deadline?: string }): Promise<ProjectResponse> => {
    return api.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data);
  },
  
  delete: async (workspaceId: string, projectId: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${workspaceId}/projects/${projectId}`);
  }
};
