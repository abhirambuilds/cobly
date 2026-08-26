import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingApi } from '../services/meeting';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Meeting, MeetingStatus } from '../types/meeting';
import type { Project } from '../types/project';
import type { WorkspaceMember } from '../types/workspace';
import { useAuth } from '../hooks/useAuth';
import { toDatetimeLocalValue, formatDate, formatTime } from '../utils/datetime';
import { AttendeePicker } from '../components/AttendeePicker';
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  MeetingStatusBadge,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../ui';

const STATUS_OPTIONS: { value: MeetingStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function MeetingDetail() {
  const { workspaceId, meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [workspaceName, setWorkspaceName] = useState('');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editStatus, setEditStatus] = useState<MeetingStatus>('scheduled');
  const [editAttendees, setEditAttendees] = useState<string[]>([]);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId || !meetingId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, meetingData, projectsData, membersData] = await Promise.all([
        workspaceApi.get(workspaceId),
        meetingApi.get(workspaceId, meetingId),
        projectApi.list(workspaceId),
        workspaceApi.getMembers(workspaceId),
      ]);
      setWorkspaceName(wsData.workspace.name);
      setMeeting(meetingData.meeting);
      setProjects(projectsData.projects);
      setMembers(membersData.members);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load this meeting.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, meetingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = () => {
    if (!meeting) return;
    setFormError('');
    setEditTitle(meeting.title);
    setEditDesc(meeting.description || '');
    setEditProjectId(meeting.projectId || '');
    setEditStart(toDatetimeLocalValue(meeting.startTime));
    setEditEnd(toDatetimeLocalValue(meeting.endTime));
    setEditLink(meeting.meetingLink || '');
    setEditStatus(meeting.status);
    setEditAttendees(meeting.attendees.map((a) => a.id));
    setIsEditing(true);
  };

  const toggleAttendee = (userId: string) => {
    setEditAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError('');
    if (new Date(editStart) >= new Date(editEnd)) {
      setFormError('End time must be after the start time.');
      return;
    }
    setSaving(true);
    try {
      const res = await meetingApi.update(workspaceId!, meetingId!, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        projectId: editProjectId || undefined,
        startTime: new Date(editStart).toISOString(),
        endTime: new Date(editEnd).toISOString(),
        meetingLink: editLink.trim(),
        status: editStatus,
        attendees: editAttendees,
      });
      setMeeting(res.meeting);
      setIsEditing(false);
      toast.success('Meeting updated.');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update meeting.');
    } finally {
      setSaving(false);
    }
  };

  const confirmMeetingDelete = async () => {
    setDeleting(true);
    try {
      await meetingApi.delete(workspaceId!, meetingId!);
      toast.success('Meeting deleted.');
      navigate(`/dashboard/workspaces/${workspaceId}/meetings`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete meeting.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (isLoading) return <MeetingDetailSkeleton />;
  if (error) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }
  if (!meeting) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <EmptyState
          icon="calendar"
          title="Meeting not found"
          message="This meeting may have been deleted or you no longer have access."
          action={
            <Link to={`/dashboard/workspaces/${workspaceId}/meetings`}>
              <Button variant="secondary" leftIcon="arrow-left">
                Back to meetings
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isWorkspaceOwner = members.find((m) => m.id === user?.id)?.role === 'owner';
  const isOrganizer = meeting.organizer === user?.id;
  const canModify = isWorkspaceOwner || isOrganizer;

  const organizer = members.find((m) => m.id === meeting.organizer);
  const projectName = meeting.projectId
    ? projects.find((p) => p.id === meeting.projectId)?.name
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: workspaceName || 'Workspace', to: `/dashboard/workspaces/${workspaceId}` },
          { label: 'Meetings', to: `/dashboard/workspaces/${workspaceId}/meetings` },
          { label: meeting.title },
        ]}
      />

      {/* Hero */}
      <Card signal className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold leading-tight text-ink">
                {meeting.title}
              </h1>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            {projectName && (
              <Link
                to={`/dashboard/workspaces/${workspaceId}/projects/${meeting.projectId}`}
                className="mt-2 inline-flex"
              >
                <Badge tone="violet" icon="folder">
                  {projectName}
                </Badge>
              </Link>
            )}
          </div>

          {canModify && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" leftIcon="edit" onClick={openEdit}>
                Edit
              </Button>
              <Button
                variant="subtle"
                size="sm"
                leftIcon="trash"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 md:col-span-2">
            <section>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Description
              </h2>
              {meeting.description ? (
                <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/90">
                  {meeting.description}
                </p>
              ) : (
                <p className="text-[13.5px] italic text-faint">No description provided.</p>
              )}
            </section>

            {meeting.meetingLink && (
              <section>
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">
                  Meeting link
                </h2>
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-[13.5px] font-medium text-brand-strong transition-colors hover:border-brand/50 hover:bg-brand/15"
                >
                  <Icon name="external-link" size={15} />
                  Join meeting
                </a>
              </section>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-5 rounded-2xl border border-line bg-surface-2 p-5">
            <div>
              <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                <Icon name="clock" size={13} />
                When
              </h2>
              <p className="text-[14px] font-medium text-ink">{formatDate(meeting.startTime)}</p>
              <p className="text-[13px] text-muted">
                {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
              </p>
            </div>

            <div className="border-t border-line pt-4">
              <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                <Icon name="crown" size={13} />
                Organizer
              </h2>
              {organizer ? (
                <div className="flex items-center gap-2">
                  <Avatar name={organizer.name} seed={organizer.id} size="sm" />
                  <span className="text-[13.5px] text-ink">{organizer.name}</span>
                </div>
              ) : (
                <span className="text-[13px] text-faint">Unknown</span>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <h2 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                <Icon name="users" size={13} />
                Attendees ({meeting.attendees.length})
              </h2>
              {meeting.attendees.length === 0 ? (
                <span className="text-[13px] text-faint">No attendees invited.</span>
              ) : (
                <ul className="space-y-2">
                  {meeting.attendees.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <Avatar name={a.name} seed={a.id} size="xs" />
                      <span className="truncate text-[13px] text-ink/90">
                        {a.name}
                        {a.id === user?.id && (
                          <span className="ml-1.5 text-[11px] text-faint">You</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </Card>

      {/* Edit modal */}
      <Modal
        open={isEditing}
        onClose={() => !saving && setIsEditing(false)}
        title="Edit meeting"
        icon="edit"
        size="lg"
        dismissOnBackdrop={!saving}
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-meeting-form"
              loading={saving}
              disabled={!editTitle.trim() || !editStart || !editEnd}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-meeting-form" onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <p className="tone-danger flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px]">
              <Icon name="alert-triangle" size={15} />
              {formError}
            </p>
          )}
          <Field htmlFor="e-title" label="Title" required>
            <Input
              id="e-title"
              data-autofocus
              required
              value={editTitle}
              maxLength={200}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="e-desc" label="Description" hint="Optional.">
            <Textarea
              id="e-desc"
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="e-status" label="Status">
              <Select
                id="e-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as MeetingStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="e-project" label="Project" hint="Optional.">
              <Select
                id="e-project"
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
              >
                <option value="">Workspace-level</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="e-start" label="Start" required>
              <Input
                id="e-start"
                required
                type="datetime-local"
                value={editStart}
                invalid={!!formError && !!editStart && !!editEnd}
                onChange={(e) => setEditStart(e.target.value)}
              />
            </Field>
            <Field htmlFor="e-end" label="End" required>
              <Input
                id="e-end"
                required
                type="datetime-local"
                value={editEnd}
                invalid={!!formError && !!editStart && !!editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
              />
            </Field>
          </div>
          <Field htmlFor="e-link" label="Meeting link" hint="Optional.">
            <Input
              id="e-link"
              type="url"
              placeholder="https://…"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
            />
          </Field>
          <Field label={`Attendees (${editAttendees.length} selected)`}>
            <AttendeePicker
              members={members}
              selected={editAttendees}
              onToggle={toggleAttendee}
              disabled={saving}
            />
          </Field>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={confirmMeetingDelete}
        loading={deleting}
        title="Delete meeting"
        message={
          <>
            Delete <span className="font-medium text-ink">{meeting.title}</span>? This cannot be
            undone.
          </>
        }
        confirmLabel="Delete meeting"
      />
    </div>
  );
}

function MeetingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-3.5 w-80 max-w-full" />
      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-4 rounded-2xl border border-line bg-surface-2 p-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </Card>
    </div>
  );
}
