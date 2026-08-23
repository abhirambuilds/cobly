export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  deadline?: string;
  workspaceId: string;
  owner: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}
