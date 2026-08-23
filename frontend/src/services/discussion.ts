import { api } from './api';
import type { DiscussionResponse, DiscussionsResponse, CommentResponse, CommentsResponse } from '../types/discussion';

export const discussionApi = {
  list: async (workspaceId: string, projectId: string): Promise<DiscussionsResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}/discussions`);
  },
  
  get: async (workspaceId: string, projectId: string, discussionId: string): Promise<DiscussionResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}`);
  },
  
  create: async (workspaceId: string, projectId: string, data: { title: string; content: string }): Promise<DiscussionResponse> => {
    return api.post(`/workspaces/${workspaceId}/projects/${projectId}/discussions`, data);
  },
  
  update: async (workspaceId: string, projectId: string, discussionId: string, data: { title?: string; content?: string }): Promise<DiscussionResponse> => {
    return api.patch(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}`, data);
  },
  
  delete: async (workspaceId: string, projectId: string, discussionId: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}`);
  }
};

export const commentApi = {
  list: async (workspaceId: string, projectId: string, discussionId: string): Promise<CommentsResponse> => {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}/comments`);
  },
  
  create: async (workspaceId: string, projectId: string, discussionId: string, data: { content: string }): Promise<CommentResponse> => {
    return api.post(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}/comments`, data);
  },
  
  update: async (workspaceId: string, projectId: string, discussionId: string, commentId: string, data: { content: string }): Promise<CommentResponse> => {
    return api.patch(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}/comments/${commentId}`, data);
  },
  
  delete: async (workspaceId: string, projectId: string, discussionId: string, commentId: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussionId}/comments/${commentId}`);
  }
};
