import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingApi } from '../services/meeting';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Meeting, MeetingStatus } from '../types/meeting';
import type { Project } from '../types/project';
import type { WorkspaceMember } from '../types/workspace';
import { useAuth } from '../hooks/useAuth';

export function MeetingDetail() {
  const { workspaceId, meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editStatus, setEditStatus] = useState<MeetingStatus>('scheduled');
  const [editAttendees, setEditAttendees] = useState<string[]>([]);

  const loadData = async () => {
    if (!workspaceId || !meetingId) return;
    setIsLoading(true);
    setError('');
    try {
      const [meetingData, projectsData, membersData] = await Promise.all([
        meetingApi.get(workspaceId, meetingId),
        projectApi.list(workspaceId),
        workspaceApi.getMembers(workspaceId)
      ]);
      setMeeting(meetingData.meeting);
      setProjects(projectsData.projects);
      setMembers(membersData.members);
      
      setEditTitle(meetingData.meeting.title);
      setEditDesc(meetingData.meeting.description || '');
      setEditProjectId(meetingData.meeting.projectId || '');
      setEditStart(new Date(meetingData.meeting.startTime).toISOString().slice(0,16));
      setEditEnd(new Date(meetingData.meeting.endTime).toISOString().slice(0,16));
      setEditLink(meetingData.meeting.meetingLink || '');
      setEditStatus(meetingData.meeting.status);
      setEditAttendees(meetingData.meeting.attendees.map(a => a.id));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "Unknown error") || 'Failed to load meeting');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, meetingId]);

  const toggleAttendee = (userId: string) => {
    if (editAttendees.includes(userId)) {
      setEditAttendees(editAttendees.filter(id => id !== userId));
    } else {
      setEditAttendees([...editAttendees, userId]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (new Date(editStart) >= new Date(editEnd)) {
        throw new Error('End time must be after start time');
      }
      await meetingApi.update(workspaceId!, meetingId!, {
        title: editTitle,
        description: editDesc,
        projectId: editProjectId || undefined,
        startTime: new Date(editStart).toISOString(),
        endTime: new Date(editEnd).toISOString(),
        meetingLink: editLink,
        status: editStatus,
        attendees: editAttendees
      });
      setIsEditing(false);
      await loadData();
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to update meeting');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingApi.delete(workspaceId!, meetingId!);
      navigate(`/dashboard/workspaces/${workspaceId}/meetings`);
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to delete meeting');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading meeting...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!meeting) return <div className="text-gray-500">Meeting not found</div>;

  const isWorkspaceOwner = members.find(m => m.user.id === user?.id)?.role === 'owner';
  const isOrganizer = meeting.organizer === user?.id;
  const canModify = isWorkspaceOwner || isOrganizer;

  const getStatusColor = (status: string) => {
    if (status === 'scheduled') return 'bg-blue-100 text-blue-800';
    if (status === 'completed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const projectName = meeting.projectId ? projects.find(p => p.id === meeting.projectId)?.name : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link to={`/dashboard/workspaces/${workspaceId}/meetings`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
        &larr; Back to Meetings
      </Link>
      
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
        {/* Status Banner */}
        <div className={`absolute top-0 left-0 w-full h-2 ${meeting.status === 'cancelled' ? 'bg-red-400' : meeting.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'}`} />
        
        <div className="flex justify-between items-start mb-6 mt-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
              <span className={`capitalize text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(meeting.status)}`}>
                {meeting.status}
              </span>
            </div>
            {projectName && (
              <p className="text-sm text-indigo-600 font-medium">Project: {projectName}</p>
            )}
          </div>
          
          {canModify && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(true)}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-gray-800 whitespace-pre-wrap">{meeting.description || 'No description provided.'}</p>
            </div>
            
            {meeting.meetingLink && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Meeting Link</h4>
                <a 
                  href={meeting.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-4 py-2 rounded-md transition-colors border border-blue-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Join Meeting
                </a>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">When</h4>
              <div className="text-gray-900 font-medium">
                <div>{new Date(meeting.startTime).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div className="text-gray-600">
                  {new Date(meeting.startTime).toLocaleTimeString([], { timeStyle: 'short' })} - {new Date(meeting.endTime).toLocaleTimeString([], { timeStyle: 'short' })}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Organizer</h4>
              <div className="text-gray-900">{members.find(m => m.user.id === meeting.organizer)?.user.name || 'Unknown'}</div>
            </div>
            
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attendees ({meeting.attendees.length})</h4>
              <ul className="space-y-2">
                {meeting.attendees.map(a => (
                  <li key={a.id} className="flex items-center gap-2 text-sm text-gray-800 bg-white px-3 py-1.5 rounded border border-gray-200">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    {a.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl my-auto">
            <h3 className="text-lg font-bold mb-4">Edit Meeting</h3>
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required autoFocus className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={editStatus} onChange={e => setEditStatus(e.target.value as MeetingStatus)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={editProjectId} onChange={e => setEditProjectId(e.target.value)}>
                    <option value="">-- Workspace Level --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={editStart} onChange={e => setEditStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <input type="url" className="w-full px-3 py-2 border rounded-md" value={editLink} onChange={e => setEditLink(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendees ({editAttendees.length} selected)</label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50 flex flex-wrap gap-2">
                    {members.map(m => {
                      const isSelected = editAttendees.includes(m.user.id);
                      return (
                        <button
                          key={m.user.id}
                          type="button"
                          onClick={() => toggleAttendee(m.user.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            isSelected ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {m.user.name} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
