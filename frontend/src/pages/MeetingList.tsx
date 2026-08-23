import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingApi } from '../services/meeting';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Meeting } from '../types/meeting';
import type { Project } from '../types/project';
import type { WorkspaceMember } from '../types/workspace';

export function MeetingList() {
  const { workspaceId } = useParams();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newAttendees, setNewAttendees] = useState<string[]>([]);

  const loadData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError('');
    try {
      const [meetingsData, projectsData, membersData] = await Promise.all([
        meetingApi.list(workspaceId),
        projectApi.list(workspaceId),
        workspaceApi.getMembers(workspaceId)
      ]);
      setMeetings(meetingsData.meetings);
      setProjects(projectsData.projects);
      setMembers(membersData.members);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : "Unknown error") || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (new Date(newStart) >= new Date(newEnd)) {
        throw new Error('End time must be after start time');
      }
      await meetingApi.create(workspaceId!, {
        title: newTitle,
        description: newDesc,
        projectId: newProjectId || undefined,
        startTime: new Date(newStart).toISOString(),
        endTime: new Date(newEnd).toISOString(),
        meetingLink: newLink,
        attendees: newAttendees
      });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      setNewProjectId('');
      setNewStart('');
      setNewEnd('');
      setNewLink('');
      setNewAttendees([]);
      await loadData();
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : "Unknown error") || 'Failed to create meeting');
    }
  };

  const toggleAttendee = (userId: string) => {
    if (newAttendees.includes(userId)) {
      setNewAttendees(newAttendees.filter(id => id !== userId));
    } else {
      setNewAttendees([...newAttendees, userId]);
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading meetings...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.endTime) > now && m.status !== 'cancelled').sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = meetings.filter(m => new Date(m.endTime) <= now || m.status === 'cancelled').sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const renderMeetingCard = (meeting: Meeting) => (
    <li key={meeting.id} className="hover:bg-gray-50 transition-colors">
      <Link to={`/dashboard/workspaces/${workspaceId}/meetings/${meeting.id}`} className="block p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
            <div className="text-sm text-gray-500 mt-1 flex gap-3 items-center">
              <span>{new Date(meeting.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} - {new Date(meeting.endTime).toLocaleTimeString([], { timeStyle: 'short' })}</span>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
            meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
            meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {meeting.status}
          </span>
        </div>
        {meeting.projectId && (
          <p className="text-xs text-indigo-600 mb-2 font-medium">
            Project: {projects.find(p => p.id === meeting.projectId)?.name || 'Unknown'}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex -space-x-2 overflow-hidden">
            {meeting.attendees.map(a => (
              <div key={a.id} className="inline-block h-6 w-6 rounded-full bg-gray-300 ring-2 ring-white flex items-center justify-center text-[10px] text-gray-700 font-bold" title={a.name}>
                {a.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">{meeting.attendees.length} attendee(s)</span>
        </div>
      </Link>
    </li>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Link to={`/dashboard/workspaces/${workspaceId}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
        &larr; Back to Workspace
      </Link>

      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 text-sm mt-1">Schedule and manage workspace events</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
        >
          + Schedule Meeting
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No upcoming meetings.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {upcoming.map(renderMeetingCard)}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden opacity-80">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Past & Cancelled</h2>
          </div>
          {past.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No past meetings.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {past.map(renderMeetingCard)}
            </ul>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl my-auto">
            <h3 className="text-lg font-bold mb-4">Schedule Meeting</h3>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required autoFocus className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project (Optional)</label>
                  <select className="w-full px-3 py-2 border rounded-md bg-white" value={newProjectId} onChange={e => setNewProjectId(e.target.value)}>
                    <option value="">-- Workspace Level --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={newStart} onChange={e => setNewStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input required type="datetime-local" className="w-full px-3 py-2 border rounded-md" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Optional)</label>
                  <input type="url" placeholder="https://..." className="w-full px-3 py-2 border rounded-md" value={newLink} onChange={e => setNewLink(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendees ({newAttendees.length} selected)</label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto bg-gray-50 flex flex-wrap gap-2">
                    {members.map(m => {
                      const isSelected = newAttendees.includes(m.user.id);
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
                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
