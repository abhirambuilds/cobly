import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { projectApi } from '../services/project';
import { activityApi } from '../services/activity';
import type { Workspace, WorkspaceMember } from '../types/workspace';
import type { Project } from '../types/project';
import type { Activity } from '../types/activity';
import { useAuth } from '../hooks/useAuth';
import { useDashboardContext } from '../hooks/useDashboardContext';
import { formatDate, formatRelativeTime } from '../utils/datetime';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  Modal,
  PageHeader,
  ProjectStatusBadge,
  RoleBadge,
  Skeleton,
  Textarea,
  cn,
  useToast,
} from '../ui';
import type { IconName } from '../ui';

type TabKey = 'projects' | 'members' | 'activity';

const ENTITY_ICON: Record<string, IconName> = {
  project: 'folder',
  task: 'check-square',
  discussion: 'discussion',
  comment: 'discussion',
  meeting: 'calendar',
  member: 'users',
  workspace: 'workspaces',
};

export function WorkspaceOverview() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWorkspaces } = useDashboardContext();
  const toast = useToast();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('projects');

  const [newMemberId, setNewMemberId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [confirmDeleteWs, setConfirmDeleteWs] = useState(false);
  const [deletingWs, setDeletingWs] = useState(false);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, membersData, projectsData, activityData] = await Promise.all([
        workspaceApi.get(workspaceId),
        workspaceApi.getMembers(workspaceId),
        projectApi.list(workspaceId),
        activityApi.list(workspaceId),
      ]);
      setWorkspace(wsData.workspace);
      setMembers(membersData.members);
      setProjects(projectsData.projects);
      setActivities(activityData.activities);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load this workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMemberId.trim() || isAddingMember) return;
    setMemberError('');
    setIsAddingMember(true);
    try {
      await workspaceApi.addMember(workspaceId!, newMemberId.trim());
      setNewMemberId('');
      await loadData();
      await refreshWorkspaces();
      toast.success('Member added to the workspace.');
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Failed to add member.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      await workspaceApi.removeMember(workspaceId!, memberToRemove.user.id);
      setMemberToRemove(null);
      await loadData();
      await refreshWorkspaces();
      toast.success('Member removed.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member.');
    } finally {
      setRemovingMember(false);
    }
  };

  const confirmDeleteWorkspace = async () => {
    setDeletingWs(true);
    try {
      await workspaceApi.delete(workspaceId!);
      await refreshWorkspaces();
      toast.success('Workspace deleted.');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete workspace.');
      setDeletingWs(false);
      setConfirmDeleteWs(false);
    }
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || creatingProject) return;
    setCreatingProject(true);
    try {
      const data = await projectApi.create(workspaceId!, {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        deadline: newProjectDeadline ? new Date(newProjectDeadline).toISOString() : undefined,
      });
      setIsCreatingProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectDeadline('');
      await loadData();
      toast.success(`“${data.project.name}” created.`, 'Project added');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project.', 'Couldn’t create project');
    } finally {
      setCreatingProject(false);
    }
  };

  if (isLoading) return <WorkspaceSkeleton />;
  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="py-8">
        <EmptyState
          icon="workspaces"
          title="Workspace not found"
          message="This workspace may have been deleted or you no longer have access."
          action={
            <Link to="/dashboard">
              <Button variant="secondary" leftIcon="arrow-left">
                Back to dashboard
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = members.find((m) => m.user.id === user?.id)?.role === 'owner';

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'members', label: 'Members', count: members.length },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: workspace.name }]}
        title={workspace.name}
        description={workspace.description || 'No description provided.'}
        actions={
          <>
            <Link to={`/dashboard/workspaces/${workspaceId}/meetings`}>
              <Button variant="secondary" leftIcon="calendar">
                Meetings
              </Button>
            </Link>
            {isOwner && (
              <Button variant="subtle" leftIcon="trash" onClick={() => setConfirmDeleteWs(true)}>
                Delete
              </Button>
            )}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={15} className="text-faint" />
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="folder" size={15} className="text-faint" />
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={15} className="text-faint" />
              Created {formatDate(workspace.createdAt)}
            </span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="-mb-px flex gap-1" role="tablist" aria-label="Workspace sections">
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'relative flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
                {typeof t.count === 'number' && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                      active ? 'bg-brand/15 text-brand-strong' : 'bg-white/[0.05] text-faint',
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panels */}
      {activeTab === 'projects' && (
        <section className="animate-fade">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Projects</h2>
            <Button size="sm" leftIcon="plus" onClick={() => setIsCreatingProject(true)}>
              New project
            </Button>
          </div>
          {projects.length === 0 ? (
            <EmptyState
              icon="folder"
              title="No projects yet"
              message="Create a project to start organizing tasks, discussions, and meetings."
              action={
                <Button leftIcon="plus" onClick={() => setIsCreatingProject(true)}>
                  New project
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/dashboard/workspaces/${workspaceId}/projects/${project.id}`}
                  className="group block"
                >
                  <Card hover className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 font-display text-[15px] font-semibold text-ink">
                        {project.name}
                      </h3>
                      <Icon
                        name="arrow-right"
                        size={16}
                        className="mt-0.5 shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand"
                      />
                    </div>
                    {project.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                        {project.description}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                      <ProjectStatusBadge status={project.status} />
                      {project.deadline && (
                        <Badge tone="neutral" icon="clock">
                          Due {formatDate(project.deadline)}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'members' && (
        <section className="animate-fade space-y-4">
          {isOwner && (
            <Card className="p-4">
              <form onSubmit={handleAddMember} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <Field
                    htmlFor="add-member-id"
                    error={memberError || undefined}
                    hint={memberError ? undefined : 'Paste a teammate’s user ID to add them.'}
                  >
                    <Input
                      id="add-member-id"
                      required
                      aria-label="User ID to add"
                      placeholder="User ID"
                      value={newMemberId}
                      invalid={!!memberError}
                      onChange={(e) => setNewMemberId(e.target.value)}
                      disabled={isAddingMember}
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  leftIcon="plus"
                  loading={isAddingMember}
                  disabled={!newMemberId.trim()}
                  className="sm:mt-0"
                >
                  Add member
                </Button>
              </form>
            </Card>
          )}

          <Card className="divide-y divide-line overflow-hidden">
            {members.map((member) => (
              <div key={member.user.id} className="flex items-center gap-3 p-4">
                <Avatar name={member.user.name} seed={member.user.id} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {member.user.name}
                    {member.user.id === user?.id && (
                      <span className="ml-2 text-[11px] font-normal text-faint">You</span>
                    )}
                  </p>
                  <p className="truncate text-[13px] text-muted">{member.user.email}</p>
                </div>
                <RoleBadge role={member.role} />
                {isOwner && member.user.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon="trash"
                    onClick={() => setMemberToRemove(member)}
                    className="text-muted hover:text-danger"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </Card>
        </section>
      )}

      {activeTab === 'activity' && (
        <section className="animate-fade">
          {activities.length === 0 ? (
            <EmptyState
              icon="activity"
              title="No activity yet"
              message="Actions in this workspace — new projects, tasks, and discussions — will appear here."
            />
          ) : (
            <Card className="p-2 sm:p-4">
              <ul className="relative space-y-1">
                {activities.map((activity, i) => {
                  const icon = ENTITY_ICON[activity.entityType] ?? 'activity';
                  const last = i === activities.length - 1;
                  return (
                    <li key={activity.id} className="relative flex gap-3.5 px-2 py-2.5">
                      {!last && (
                        <span
                          aria-hidden
                          className="absolute bottom-0 left-[27px] top-11 w-px bg-line"
                        />
                      )}
                      <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line-strong bg-surface-2 text-brand">
                        <Icon name={icon} size={16} />
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className="text-sm leading-snug text-muted">
                          <span className="font-medium text-ink">{activity.actor.name}</span>{' '}
                          {activity.action.replace(/_/g, ' ')} {article(activity.entityType)}{' '}
                          <span className="text-ink">{activity.entityType}</span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-faint">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      )}

      {/* Create project modal */}
      <Modal
        open={isCreatingProject}
        onClose={() => !creatingProject && setIsCreatingProject(false)}
        title="Create project"
        description="Projects hold tasks, discussions, and meetings."
        icon="folder"
        size="sm"
        dismissOnBackdrop={!creatingProject}
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsCreatingProject(false)} disabled={creatingProject}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-project-form"
              loading={creatingProject}
              disabled={!newProjectName.trim()}
            >
              Create project
            </Button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleCreateProject} className="space-y-4">
          <Field htmlFor="ws-project-name" label="Name" required>
            <Input
              id="ws-project-name"
              data-autofocus
              required
              placeholder="e.g. Website redesign"
              value={newProjectName}
              maxLength={120}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </Field>
          <Field htmlFor="ws-project-desc" label="Description" hint="Optional.">
            <Textarea
              id="ws-project-desc"
              rows={3}
              placeholder="What’s this project about?"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </Field>
          <Field htmlFor="ws-project-deadline" label="Deadline" hint="Optional.">
            <Input
              id="ws-project-deadline"
              type="datetime-local"
              value={newProjectDeadline}
              onChange={(e) => setNewProjectDeadline(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      {/* Confirm: remove member */}
      <ConfirmDialog
        open={!!memberToRemove}
        onClose={() => !removingMember && setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        loading={removingMember}
        title="Remove member"
        message={
          <>
            Remove <span className="font-medium text-ink">{memberToRemove?.user.name}</span> from this
            workspace? They’ll lose access to its projects and discussions.
          </>
        }
        confirmLabel="Remove"
      />

      {/* Confirm: delete workspace */}
      <ConfirmDialog
        open={confirmDeleteWs}
        onClose={() => !deletingWs && setConfirmDeleteWs(false)}
        onConfirm={confirmDeleteWorkspace}
        loading={deletingWs}
        title="Delete workspace"
        message={
          <>
            Permanently delete <span className="font-medium text-ink">{workspace.name}</span>? This
            removes all its projects, tasks, and discussions. This cannot be undone.
          </>
        }
        confirmLabel="Delete workspace"
      />
    </div>
  );
}

function article(entity: string): string {
  return /^[aeiou]/i.test(entity) ? 'an' : 'a';
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex gap-4 border-b border-line pb-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
