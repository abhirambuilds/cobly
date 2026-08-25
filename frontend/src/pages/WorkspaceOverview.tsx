import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { projectApi } from '../services/project';
import { activityApi } from '../services/activity';
import type { Workspace, WorkspaceMember } from '../types/workspace';
import type { Project } from '../types/project';
import type { Activity } from '../types/activity';
import { useAuth } from '../hooks/useAuth';

export function WorkspaceOverview() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'activity'>('projects');

  const [newMemberId, setNewMemberId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const loadData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, membersData, projectsData, activityData] = await Promise.all([
        workspaceApi.get(workspaceId),
        workspaceApi.getMembers(workspaceId),
        projectApi.list(workspaceId),
        activityApi.list(workspaceId)
      ]);
      setWorkspace(wsData.workspace);
      setMembers(membersData.members);
      setProjects(projectsData.projects);
      setActivities(activityData.activities);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "Unknown error") || 'Failed to load workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');
    setIsAddingMember(true);
    try {
      await workspaceApi.addMember(workspaceId!, newMemberId);
      setNewMemberId('');
      await loadData();
    } catch (err: unknown) {
      setMemberError((err instanceof Error ? err.message : "Unknown error") || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await workspaceApi.removeMember(workspaceId!, userId);
      await loadData();
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to remove member');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Are you sure you want to delete ${workspace?.name} permanently?`)) return;
    try {
      await workspaceApi.delete(workspaceId!);
      navigate('/dashboard');
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to delete workspace');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.create(workspaceId!, { 
        name: newProjectName, 
        description: newProjectDesc,
        deadline: newProjectDeadline ? new Date(newProjectDeadline).toISOString() : undefined
      });
      setIsCreatingProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectDeadline('');
      await loadData();
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to create project');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading workspace...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!workspace) return <div className="text-gray-500">Workspace not found</div>;

  const isOwner = members.find(m => m.user.id === user?.id)?.role === 'owner';

  const formatActivityAction = (activity: Activity) => {
    const actionLabel = activity.action.replace(/_/g, ' ');
    const entityLabel = activity.entityType;
    return (
      <span>
        <span className="font-semibold text-gray-900">{activity.actor.name}</span> {actionLabel} a {entityLabel}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{workspace.name}</h1>
          <p className="text-gray-600">{workspace.description || 'No description provided.'}</p>
          <div className="mt-4">
            <Link 
              to={`/dashboard/workspaces/${workspaceId}/meetings`}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors border border-blue-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Meetings
            </Link>
          </div>
        </div>
        {isOwner && (
          <button 
            onClick={handleDeleteWorkspace}
            className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          >
            Delete Workspace
          </button>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'projects' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'activity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Activity
          </button>
        </nav>
      </div>

      {activeTab === 'projects' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <button 
              onClick={() => setIsCreatingProject(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              + Create Project
            </button>
          </div>
          
          {projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No projects yet. Create one to get started.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {projects.map(project => (
                <li key={project.id} className="hover:bg-gray-50 transition-colors">
                  <Link to={`/dashboard/workspaces/${workspaceId}/projects/${project.id}`} className="p-5 flex justify-between items-center block">
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{project.name}</p>
                      {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span className="capitalize border px-2 py-0.5 rounded-full border-gray-200 bg-white">{project.status}</span>
                        {project.deadline && <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-8">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Members ({members.length})</h2>
          </div>
          
          {isOwner && (
            <div className="p-5 border-b border-gray-200">
              <form onSubmit={handleAddMember} className="flex gap-3">
                <input
                  required
                  placeholder="User ID to add"
                  className="flex-1 max-w-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMemberId}
                  onChange={e => setNewMemberId(e.target.value)}
                  disabled={isAddingMember}
                />
                <button 
                  type="submit"
                  disabled={isAddingMember}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:bg-blue-400"
                >
                  {isAddingMember ? 'Adding...' : 'Add Member'}
                </button>
              </form>
              {memberError && <p className="text-red-600 text-sm mt-2">{memberError}</p>}
            </div>
          )}

          <ul className="divide-y divide-gray-200">
            {members.map(member => (
              <li key={member.user.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{member.user.name}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {member.role}
                  </span>
                  {isOwner && member.user.id !== user?.id && (
                    <button 
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No activity yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activities.map(activity => (
                <li key={activity.id} className="p-5 hover:bg-gray-50 transition-colors flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {activity.actor.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm">{formatActivityAction(activity)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isCreatingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  autoFocus
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProjectDeadline}
                  onChange={e => setNewProjectDeadline(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
