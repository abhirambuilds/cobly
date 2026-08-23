import type { User } from './auth';

export interface WorkspaceMember {
  user: User;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceResponse {
  workspace: Workspace;
}

export interface WorkspacesResponse {
  workspaces: Workspace[];
}

export interface MembersResponse {
  members: WorkspaceMember[];
}
