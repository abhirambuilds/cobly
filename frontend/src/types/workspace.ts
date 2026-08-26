

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  membersCount: number;
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
