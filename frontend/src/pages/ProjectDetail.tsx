import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectApi } from '../services/project';
import { taskApi } from '../services/task';
import { workspaceApi } from '../services/workspace';
import { discussionApi } from '../services/discussion';
import type { Project } from '../types/project';
import type { Task, TaskStatus, TaskPriority } from '../types/task';
import type { Discussion } from '../types/discussion';
import type { WorkspaceMember } from '../types/workspace';
import { useAuth } from '../hooks/useAuth';

export function ProjectDetail() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'tasks' | 'discussions'>('tasks');

  // Project Edit State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState<string>('active');
  const [editProjectDeadline, setEditProjectDeadline] = useState('');

  // Task Create State
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');

  // Task Edit State
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Discussion Create State
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');

  const loadData = async () => {
    if (!workspaceId || !projectId) return;
    setIsLoading(true);
    setError('');
    try {
      const [projData, tasksData, discData, memData] = await Promise.all([
        projectApi.get(workspaceId, projectId),
        taskApi.list(workspaceId, projectId),
        discussionApi.list(workspaceId, projectId),
        workspaceApi.getMembers(workspaceId)
      ]);
      setProject(projData.project);
      setTasks(tasksData.tasks);
      setDiscussions(discData.discussions);
      setMembers(memData.members);
      
      setEditProjectName(projData.project.name);
      setEditProjectDesc(projData.project.description || '');
      setEditProjectStatus(projData.project.status);
      setEditProjectDeadline(projData.project.deadline ? new Date(projData.project.deadline).toISOString().slice(0,16) : '');
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, projectId]);

  // Project Handlers
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.update(workspaceId!, projectId!, {
        name: editProjectName,
        description: editProjectDesc,
        status: editProjectStatus,
        deadline: editProjectDeadline ? new Date(editProjectDeadline).toISOString() : undefined
      });
      setIsEditingProject(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectApi.delete(workspaceId!, projectId!);
      navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskApi.create(workspaceId!, projectId!, {
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        assigneeId: newTaskAssignee || undefined
      });
      setIsCreatingTask(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskStatus('todo');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await taskApi.update(workspaceId!, projectId!, editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString() : undefined,
        assigneeId: editingTask.assignee?.id || null
      });
      setEditingTask(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.delete(workspaceId!, projectId!, taskId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Discussion Handlers
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await discussionApi.create(workspaceId!, projectId!, {
        title: newDiscussionTitle,
        content: newDiscussionContent
      });
      setIsCreatingDiscussion(false);
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create discussion');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading project...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div className="text-gray-500">Project not found</div>;

  const isWorkspaceOwner = members.find(m => m.user.id === user?.id)?.role === 'owner';
  const isProjectOwner = project.owner === user?.id;
  const canEditProject = isWorkspaceOwner || isProjectOwner;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTaskColumn = (status: TaskStatus, title: string) => {
    const columnTasks = tasks.filter(t => t.status === status);
    return (
      <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
          {title}
          <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
        </h3>
        <div className="space-y-3">
          {columnTasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditingTask(task)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 leading-tight">{task.title}</h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              {task.dueDate && (
                <p className="text-xs text-gray-500 mb-2">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {task.assignee ? task.assignee.name : 'Unassigned'}
                </div>
              </div>
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded text-sm text-gray-400">
              No tasks
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Link to={`/dashboard/workspaces/${workspaceId}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
        &larr; Back to Workspace
      </Link>
      
      <div className="flex justify-between items-start bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className="capitalize text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {project.status}
            </span>
          </div>
          <p className="text-gray-600 max-w-3xl">{project.description || 'No description provided.'}</p>
          {project.deadline && (
            <p className="text-sm text-gray-500 mt-2">
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {canEditProject && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditingProject(true)}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
            >
              Edit Project
            </button>
            <button 
              onClick={handleDeleteProject}
              className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'discussions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Discussions
          </button>
        </nav>
      </div>

      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
            <button 
              onClick={() => setIsCreatingTask(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              + New Task
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {renderTaskColumn('todo', 'To Do')}
            {renderTaskColumn('in_progress', 'In Progress')}
            {renderTaskColumn('completed', 'Completed')}
          </div>
        </div>
      )}

      {activeTab === 'discussions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
            <button 
              onClick={() => setIsCreatingDiscussion(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              + New Discussion
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {discussions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No discussions yet. Start a conversation!</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {discussions.map(discussion => (
                  <li key={discussion.id} className="hover:bg-gray-50 transition-colors">
                    <Link to={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussion.id}`} className="block p-5">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{discussion.title}</h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(discussion.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {discussion.content}
                      </p>
                      <div className="text-xs text-gray-500 font-medium">
                        Posted by {discussion.author.name}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {isCreatingDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4">Start a Discussion</h3>
            <form onSubmit={handleCreateDiscussion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required autoFocus className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newDiscussionTitle} onChange={e => setNewDiscussionTitle(e.target.value)} />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required rows={6} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newDiscussionContent} onChange={e => setNewDiscussionContent(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreatingDiscussion(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Post Discussion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Edit Project</h3>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editProjectName}
                  onChange={e => setEditProjectName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editProjectDesc}
                  onChange={e => setEditProjectDesc(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={editProjectStatus}
                  onChange={e => setEditProjectStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editProjectDeadline}
                  onChange={e => setEditProjectDeadline(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditingProject(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreatingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Create Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required autoFocus className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={newTaskStatus} onChange={e => setNewTaskStatus(e.target.value as TaskStatus)}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreatingTask(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Task</h3>
              <button 
                onClick={() => handleDeleteTask(editingTask.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete Task
              </button>
            </div>
            <form onSubmit={handleUpdateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingTask.title} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={editingTask.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value as TaskStatus})}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={editingTask.priority} onChange={e => setEditingTask({...editingTask, priority: e.target.value as TaskPriority})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={editingTask.assignee?.id || ''} onChange={e => setEditingTask({...editingTask, assignee: e.target.value ? { id: e.target.value, name: '...', email: '...' } : null})}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0,16) : ''} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
