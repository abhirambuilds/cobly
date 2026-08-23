import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { Workspace } from '../types/workspace';
import { useAuth } from '../hooks/useAuth';

export function DashboardLayout() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation();

  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceApi.list();
      setWorkspaces(data.workspaces);
    } catch (err: any) {
      if (err.message.includes('401')) {
        logout();
      } else {
        setError('Failed to load workspaces');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [location.pathname]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await workspaceApi.create({ name: newWsName, description: newWsDesc });
      setWorkspaces([...workspaces, data.workspace]);
      setIsCreating(false);
      setNewWsName('');
      setNewWsDesc('');
      navigate(`/dashboard/workspaces/${data.workspace.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Workspaces</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + New
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <div className="text-sm text-gray-500 p-2">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="text-sm text-gray-500 p-2">No workspaces yet.</div>
          ) : (
            workspaces.map(ws => (
              <Link 
                key={ws.id} 
                to={`/dashboard/workspaces/${ws.id}`}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  workspaceId === ws.id 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {ws.name}
              </Link>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white p-8">
        <Outlet />
      </main>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  autoFocus
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newWsDesc}
                  onChange={e => setNewWsDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
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
