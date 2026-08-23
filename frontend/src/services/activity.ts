import { api } from './api';
import type { ActivityResponse } from '../types/activity';

export const activityApi = {
  list: async (workspaceId: string): Promise<ActivityResponse> => {
    return api.get(`/workspaces/${workspaceId}/activity`);
  }
};
