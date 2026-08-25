import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingApi } from '../services/meeting';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Meeting } from '../types/meeting';
import type { Project } from '../types/project';
import type { WorkspaceMember } from '../types/workspace';
import { formatDateTime, formatTime } from '../utils/datetime';
import { AttendeePicker } from '../components/AttendeePicker';
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  MeetingStatusBadge,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../ui';

export function MeetingList() {
  const { workspaceId } = useParams();
  const toast = useToast();

  const [workspaceName, setWorkspaceName] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newAttendees, setNewAttendees] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, meetingsData, projectsData, membersData] = await Promise.all([
        workspaceApi.get(workspaceId),
        meetingApi.list(workspaceId),
        projectApi.list(workspaceId),
        workspaceApi.getMembers(workspaceId),
      ]);
      setWorkspaceName(wsData.workspace.name);
      setMeetings(meetingsData.meetings);
      setProjects(projectsData.projects);
      setMembers(membersData.members);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setFormError('');
    setNewTitle('');
    setNewDesc('');
    setNewProjectId('');
    setNewStart('');
    setNewEnd('');
    setNewLink('');
    setNewAttendees([]);
    setIsCreating(true);
  };

  const toggleAttendee = (userId: string) => {
    setNewAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setFormError('');
    if (new Date(newStart) >= new Date(newEnd)) {
      setFormError('End time must be after the start time.');
      return;
    }
    setCreating(true);
    try {
      await meetingApi.create(workspaceId!, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        projectId: newProjectId || undefined,
        startTime: new Date(newStart).toISOString(),
        endTime: new Date(newEnd).toISOString(),
        meetingLink: newLink.trim() || undefined,
        attendees: newAttendees,
      });
      setIsCreating(false);
      await loadData();
      toast.success('Meeting scheduled.');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule meeting.');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <MeetingListSkeleton />;
  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  const now = new Date();
  const upcoming = meetings
    .filter((m) => new Date(m.endTime) > now && m.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const past = meetings
    .filter((m) => new Date(m.endTime) <= now || m.status === 'cancelled')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const projectName = (id?: string) =>
    id ? projects.find((p) => p.id === id)?.name : undefined;

  const renderMeeting = (meeting: Meeting) => (
    <Link
      key={meeting.id}
      to={`/dashboard/workspaces/${workspaceId}/meetings/${meeting.id}`}
      className="group block"
    >
      <Card hover className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-[15px] font-semibold text-ink">
            {meeting.title}
          </h3>
          <MeetingStatusBadge status={meeting.status} />
        </div>

        <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-muted">
          <Icon name="clock" size={14} className="text-faint" />
          {formatDateTime(meeting.startTime)} – {formatTime(meeting.endTime)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-2">
            <AvatarStack
              users={meeting.attendees.map((a) => ({ id: a.id, name: a.name }))}
              size="xs"
              max={4}
            />
            <span className="text-[12px] text-faint">
              {meeting.attendees.length}{' '}
              {meeting.attendees.length === 1 ? 'attendee' : 'attendees'}
            </span>
          </div>
          {projectName(meeting.projectId) && (
            <Badge tone="violet" icon="folder">
              {projectName(meeting.projectId)}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-7">
      <PageHeader
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: workspaceName || 'Workspace', to: `/dashboard/workspaces/${workspaceId}` },
          { label: 'Meetings' },
        ]}
        title="Meetings"
        description="Schedule and manage workspace events."
        actions={
          <Button leftIcon="plus" onClick={openCreate}>
            Schedule meeting
          </Button>
        }
      />

      {meetings.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No meetings yet"
          message="Schedule a meeting to bring your team together and keep everyone aligned."
          action={
            <Button leftIcon="plus" onClick={openCreate}>
              Schedule meeting
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
              Upcoming
              <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[11px] tabular-nums text-faint">
                {upcoming.length}
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <Card className="p-6 text-center text-[13.5px] text-faint">
                No upcoming meetings scheduled.
              </Card>
            ) : (
              <div className="grid gap-3.5 sm:grid-cols-2">{upcoming.map(renderMeeting)}</div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
                Past &amp; cancelled
                <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[11px] tabular-nums text-faint">
                  {past.length}
                </span>
              </h2>
              <div className="grid gap-3.5 opacity-90 sm:grid-cols-2">{past.map(renderMeeting)}</div>
            </section>
          )}
        </div>
      )}

      {/* Schedule meeting modal */}
      <Modal
        open={isCreating}
        onClose={() => !creating && setIsCreating(false)}
        title="Schedule meeting"
        description="Set a time, invite attendees, and optionally attach it to a project."
        icon="calendar"
        size="lg"
        dismissOnBackdrop={!creating}
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsCreating(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-meeting-form"
              loading={creating}
              disabled={!newTitle.trim() || !newStart || !newEnd}
            >
              Schedule
            </Button>
          </>
        }
      >
        <form id="create-meeting-form" onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <p className="tone-danger flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px]">
              <Icon name="alert-triangle" size={15} />
              {formError}
            </p>
          )}
          <Field htmlFor="m-title" label="Title" required>
            <Input
              id="m-title"
              data-autofocus
              required
              placeholder="e.g. Sprint planning"
              value={newTitle}
              maxLength={200}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="m-desc" label="Description" hint="Optional.">
            <Textarea
              id="m-desc"
              rows={2}
              placeholder="Agenda or context…"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </Field>
          <Field htmlFor="m-project" label="Project" hint="Optional — leave as workspace-level.">
            <Select
              id="m-project"
              value={newProjectId}
              onChange={(e) => setNewProjectId(e.target.value)}
            >
              <option value="">Workspace-level</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="m-start" label="Start" required>
              <Input
                id="m-start"
                required
                type="datetime-local"
                value={newStart}
                invalid={!!formError && !!newStart && !!newEnd}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </Field>
            <Field htmlFor="m-end" label="End" required>
              <Input
                id="m-end"
                required
                type="datetime-local"
                value={newEnd}
                invalid={!!formError && !!newStart && !!newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </Field>
          </div>
          <Field htmlFor="m-link" label="Meeting link" hint="Optional.">
            <Input
              id="m-link"
              type="url"
              placeholder="https://…"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
            />
          </Field>
          <Field label={`Attendees (${newAttendees.length} selected)`}>
            <AttendeePicker
              members={members}
              selected={newAttendees}
              onToggle={toggleAttendee}
              disabled={creating}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

function MeetingListSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-5 w-28" />
      <div className="grid gap-3.5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
