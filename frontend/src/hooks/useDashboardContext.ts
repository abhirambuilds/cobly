import { useOutletContext } from 'react-router-dom';
import type { Workspace } from '../types/workspace';

/** Shared state provided by DashboardLayout to its nested routes. */
export type DashboardContext = {
  workspaces: Workspace[];
  workspacesLoading: boolean;
  workspacesError: string;
  refreshWorkspaces: () => Promise<void>;
  openCreateWorkspace: () => void;
};

export function useDashboardContext(): DashboardContext {
  return useOutletContext<DashboardContext>();
}
