import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { Workspace, WorkspaceMember } from '../types/workspace';
import { useAuth } from '../hooks/useAuth';

export function WorkspaceOverview() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newMemberId, setNewMemberId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const loadData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, membersData] = await Promise.all([
        workspaceApi.get(workspaceId),
        workspaceApi.getMembers(workspaceId)
      ]);
      setWorkspace(wsData.workspace);
      setMembers(membersData.members);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace');
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
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await workspaceApi.removeMember(workspaceId!, userId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm(`Are you sure you want to delete ${workspace?.name} permanently?`)) return;
    try {
      await workspaceApi.delete(workspaceId!);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to delete workspace');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading workspace...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!workspace) return <div className="text-gray-500">Workspace not found</div>;

  const isOwner = members.find(m => m.user.id === user?.id)?.role === 'owner';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{workspace.name}</h1>
          <p className="text-gray-600">{workspace.description || 'No description provided.'}</p>
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

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
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
      
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg">
        <h3 className="text-blue-800 font-semibold mb-2">Projects & Tasks</h3>
        <p className="text-blue-600 text-sm">
          The Projects and Tasks UI will be implemented in future updates. 
          Use the backend APIs to manage them for now.
        </p>
      </div>
    </div>
  );
}
