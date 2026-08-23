import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { notificationApi } from '../services/notification';
import type { Workspace } from '../types/workspace';
import type { Notification } from '../types/notification';
import { useAuth } from '../hooks/useAuth';

export function DashboardLayout() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceApi.list();
      setWorkspaces(data.workspaces);
    } catch (err: unknown) {
      if ((err instanceof Error ? err.message : "Unknown error").includes('401')) {
        logout();
      } else {
        alert('Failed to load workspaces');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications);
    } catch (err) {
      // Silently fail for notifications to not disrupt core UX
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await workspaceApi.create({ name: newWsName, description: newWsDesc });
      await fetchWorkspaces();
      setIsCreating(false);
      setNewWsName('');
      setNewWsDesc('');
      navigate(`/dashboard/workspaces/${data.workspace.id}`);
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to create workspace');
    }
  };
  
  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) { }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) { }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) { }
  };

  const navigateNotification = (n: Notification) => {
    setShowNotifications(false);
    if (!n.workspaceId) return;
    
    // Attempt best-effort routing based on entityType
    if (n.entityType === 'task' && n.projectId && n.entityId) {
      // We don't have a standalone task page, tasks are in projects
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}`);
    } else if (n.entityType === 'discussion' && n.projectId && n.entityId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}/discussions/${n.entityId}`);
    } else if (n.entityType === 'comment' && n.projectId) {
      // Usually comments have their discussion as the parent or in metadata, but lacking that, just go to project
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}`);
    } else if (n.entityType === 'meeting' && n.entityId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/meetings/${n.entityId}`);
    } else if (n.entityType === 'project' && n.entityId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.entityId}`);
    } else {
      navigate(`/dashboard/workspaces/${n.workspaceId}`);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight">Cobly</Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Workspaces</span>
            <button onClick={() => setIsCreating(true)} className="hover:text-white transition-colors">
              + New
            </button>
          </div>
          
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No workspaces yet.</div>
          ) : (
            <ul className="space-y-1">
              {workspaces.map(ws => {
                const isActive = workspaceId === ws.id;
                return (
                  <li key={ws.id}>
                    <Link 
                      to={`/dashboard/workspaces/${ws.id}`}
                      className={`block px-4 py-2 text-sm transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                    >
                      {ws.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 text-sm">
          <div className="text-gray-400 mb-2 truncate">{user?.email}</div>
          <button 
            onClick={logout}
            className="w-full text-left text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-end px-6 relative z-30">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications();
              }}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">You have no notifications.</div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {notifications.map(n => (
                        <li 
                          key={n.id} 
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${n.read ? 'opacity-70' : 'bg-blue-50/50'}`}
                          onClick={() => navigateNotification(n)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${n.read ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>{n.title}</h4>
                            <div className="flex gap-2 items-center ml-2">
                              {!n.read && (
                                <button onClick={(e) => handleMarkRead(n.id, e)} className="text-[10px] text-blue-600 hover:underline">
                                  Mark Read
                                </button>
                              )}
                              <button onClick={(e) => handleDeleteNotification(n.id, e)} className="text-gray-400 hover:text-red-500" title="Delete">
                                &times;
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{n.message}</p>
                          <div className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Create Workspace Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create New Workspace</h3>
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
