import { api } from './api';
import type {
  Workspace,
  WorkspaceResponse,
  WorkspacesResponse,
  MembersResponse,
} from '../types/workspace';

// The API can return a workspace without a populated `members` array (e.g. the
// response immediately after creation). The Workspace type treats `members` as
// always-present, so we normalize at the service boundary to guarantee an array.
// This keeps every consumer (sidebar counts, dashboard rollups) crash-safe
// without inventing data — a missing list simply becomes an empty one.
const withMembers = (ws: Workspace): Workspace => ({
  ...ws,
  members: Array.isArray(ws.members) ? ws.members : [],
});

export const workspaceApi = {
  list: async (): Promise<WorkspacesResponse> => {
    const data: WorkspacesResponse = await api.get('/workspaces');
    return { ...data, workspaces: (data.workspaces ?? []).map(withMembers) };
  },

  get: async (id: string): Promise<WorkspaceResponse> => {
    const data: WorkspaceResponse = await api.get(`/workspaces/${id}`);
    return { ...data, workspace: withMembers(data.workspace) };
  },

  create: async (data: { name: string; description?: string }): Promise<WorkspaceResponse> => {
    const res: WorkspaceResponse = await api.post('/workspaces', data);
    return { ...res, workspace: withMembers(res.workspace) };
  },
  
  delete: async (id: string): Promise<{ success: boolean }> => {
    return api.del(`/workspaces/${id}`);
  },

  getMembers: async (workspaceId: string): Promise<MembersResponse> => {
    return api.get(`/workspaces/${workspaceId}/members`);
  },

  addMember: async (workspaceId: string, userId: string): Promise<{ message: string }> => {
    return api.post(`/workspaces/${workspaceId}/members`, { userId });
  },

  removeMember: async (workspaceId: string, userId: string): Promise<{ message: string }> => {
    return api.del(`/workspaces/${workspaceId}/members/${userId}`);
  }
};
