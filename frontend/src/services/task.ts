import { api } from './api';
import type { TaskResponse, TasksResponse } from '../types/task';

export const taskApi = {
  list: async (workspaceId: string, projectId: string): Promise<TasksResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
  },
  
  get: async (workspaceId: string, projectId: string, taskId: string): Promise<TaskResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
  },
  
  create: async (workspaceId: string, projectId: string, data: Record<string, unknown>): Promise<TaskResponse> => {
    return api.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, data);
  },
  
  update: async (workspaceId: string, projectId: string, taskId: string, data: Record<string, unknown>): Promise<TaskResponse> => {
    return api.patch(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, data);
  },
  
  delete: async (workspaceId: string, projectId: string, taskId: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
  }
};
