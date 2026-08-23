import type { User } from './auth';

export interface Activity {
  id: string;
  workspaceId: string;
  actor: User;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityResponse {
  activities: Activity[];
}
