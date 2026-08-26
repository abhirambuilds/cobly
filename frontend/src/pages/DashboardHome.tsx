import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboardContext } from '../hooks/useDashboardContext';
import type { Workspace } from '../types/workspace';
import { formatDate } from '../utils/datetime';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  RoleBadge,
  Skeleton,
} from '../ui';
import type { IconName } from '../ui';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHome() {
  const { user } = useAuth();
  const { workspaces, workspacesLoading, workspacesError, refreshWorkspaces, openCreateWorkspace } =
    useDashboardContext();

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there';

  const ownedCount = workspaces.filter((ws) => ws.ownerId === user?.id).length;

  const stats: Array<{ icon: IconName; label: string; value: number }> = [
    { icon: 'workspaces', label: 'Workspaces', value: workspaces.length },
    { icon: 'crown', label: 'Owned by you', value: ownedCount },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()}, ${firstName}`}
        description="Your workspaces at a glance. Jump back in or spin up a new one."
        actions={
          <Button leftIcon="plus" onClick={openCreateWorkspace}>
            New workspace
          </Button>
        }
      />

      {/* Stats — derived only from real workspace data */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line-strong bg-surface-2 text-brand">
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tabular-nums text-ink">
                {workspacesLoading ? '—' : s.value}
              </p>
              <p className="text-[13px] text-muted">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Your workspaces</h2>
          {workspaces.length > 0 && (
            <span className="text-[13px] text-faint">
              {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'}
            </span>
          )}
        </div>

        {workspacesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="space-y-4 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : workspacesError ? (
          <ErrorState message={workspacesError} onRetry={refreshWorkspaces} />
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon="workspaces"
            title="Create your first workspace"
            message="Workspaces hold your projects, members, and discussions. Make one to get started."
            action={
              <Button leftIcon="plus" onClick={openCreateWorkspace}>
                New workspace
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WorkspaceCard({
  workspace,
  currentUserId,
}: {
  workspace: Workspace;
  currentUserId?: string;
}) {
  const myRole = workspace.ownerId === currentUserId ? 'owner' : 'member';

  return (
    <Link to={`/dashboard/workspaces/${workspace.id}`} className="group block h-full">
      <Card hover signal className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand/40 bg-brand/15 font-display text-base font-semibold uppercase text-brand-strong">
              {workspace.name.trim().charAt(0) || '?'}
            </span>
            <h3 className="min-w-0 truncate font-display text-base font-semibold text-ink">
              {workspace.name}
            </h3>
          </div>
          <Icon
            name="arrow-right"
            size={16}
            className="mt-1 shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand"
          />
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-muted">
          {workspace.description || 'No description yet.'}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-2 text-[12px] text-faint">
            <Icon name="users" size={14} />
            <span>
              {workspace.membersCount} {workspace.membersCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <RoleBadge role={myRole} />
        </div>

        <p className="mt-3 border-t border-line pt-3 text-[11.5px] text-faint">
          Created {formatDate(workspace.createdAt)}
        </p>
      </Card>
    </Link>
  );
}
