import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { workspaceApi } from '../services/workspace';
import { notificationApi } from '../services/notification';
import { ApiError } from '../services/api';
import type { Workspace } from '../types/workspace';
import type { Notification } from '../types/notification';
import { useAuth } from '../hooks/useAuth';
import { formatRelativeTime } from '../utils/datetime';
import {
  Avatar,
  Button,
  Icon,
  IconButton,
  Field,
  Input,
  Modal,
  Skeleton,
  Textarea,
  cn,
  useToast,
} from '../ui';

export function DashboardLayout() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { workspaceId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const toast = useToast();

  const notifRef = useRef<HTMLDivElement>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadError('');
      const data = await workspaceApi.list();
      setWorkspaces(data.workspaces);
    } catch (err: unknown) {
      // 401 is handled centrally by the API client (token cleared + redirect);
      // surface only other failures inline.
      if (err instanceof ApiError && err.status === 401) {
        logout();
      } else {
        setLoadError('Couldn’t load your workspaces.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(data.notifications);
    } catch {
      // Notifications are non-critical; fail quietly so core UX is unaffected.
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
  }, [fetchWorkspaces, fetchNotifications]);

  // Close the notifications popover on outside click or Escape.
  useEffect(() => {
    if (!showNotifications) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowNotifications(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showNotifications]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const openCreate = () => {
    setNewWsName('');
    setNewWsDesc('');
    setIsCreating(true);
  };

  const handleCreateWorkspace = async (e: FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await workspaceApi.create({
        name: newWsName.trim(),
        description: newWsDesc.trim() || undefined,
      });
      await fetchWorkspaces();
      setIsCreating(false);
      toast.success(`“${data.workspace.name}” is ready.`, 'Workspace created');
      navigate(`/dashboard/workspaces/${data.workspace.id}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Please try again.',
        'Couldn’t create workspace',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationApi.markRead(id);
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationApi.markAllRead();
    } catch {
      setNotifications(previous);
      toast.error('Couldn’t update your notifications.');
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationApi.delete(id);
    } catch {
      setNotifications(previous);
      toast.error('Couldn’t remove that notification.');
    }
  };

  const navigateNotification = (n: Notification) => {
    setShowNotifications(false);
    if (!n.workspaceId) return;
    if (n.entityType === 'task' && n.projectId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}`);
    } else if (n.entityType === 'discussion' && n.projectId && n.entityId) {
      navigate(
        `/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}/discussions/${n.entityId}`,
      );
    } else if (n.entityType === 'comment' && n.projectId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.projectId}`);
    } else if (n.entityType === 'meeting' && n.entityId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/meetings/${n.entityId}`);
    } else if (n.entityType === 'project' && n.entityId) {
      navigate(`/dashboard/workspaces/${n.workspaceId}/projects/${n.entityId}`);
    } else {
      navigate(`/dashboard/workspaces/${n.workspaceId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const homeActive = pathname === '/dashboard' || pathname === '/dashboard/';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 rounded-lg text-ink"
          aria-label="Cobly dashboard"
        >
          <img src="/favicon.svg" alt="" width={26} height={26} className="rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight">Cobly</span>
        </Link>
        <IconButton
          icon="close"
          label="Close menu"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Primary">
        <Link
          to="/dashboard"
          className={cn(
            'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            homeActive ? 'bg-white/[0.05] text-ink' : 'text-muted hover:bg-white/[0.03] hover:text-ink',
          )}
        >
          {homeActive && (
            <span aria-hidden className="signal-line absolute inset-y-2 left-0 w-[3px] rounded-full" />
          )}
          <Icon name="home" size={18} />
          Home
        </Link>

        <div className="mb-1.5 mt-5 flex items-center justify-between px-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Workspaces
          </span>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md p-0.5 text-faint transition-colors hover:text-brand"
            aria-label="Create workspace"
            title="Create workspace"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-1.5 px-1 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="px-3 py-2 text-sm text-muted">
            <p className="mb-2">{loadError}</p>
            <Button variant="subtle" size="sm" leftIcon="refresh" onClick={fetchWorkspaces}>
              Retry
            </Button>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="mx-1 mt-1 rounded-xl border border-dashed border-line-strong px-3 py-4 text-center">
            <p className="text-[13px] text-muted">No workspaces yet.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 text-[13px] font-medium text-brand hover:text-brand-strong"
            >
              Create your first
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {workspaces.map((ws) => {
              const isActive = workspaceId === ws.id;
              return (
                <li key={ws.id}>
                  <Link
                    to={`/dashboard/workspaces/${ws.id}`}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-white/[0.05] text-ink'
                        : 'text-muted hover:bg-white/[0.03] hover:text-ink',
                    )}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="signal-line absolute inset-y-2 left-0 w-[3px] rounded-full"
                      />
                    )}
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[12px] font-semibold uppercase transition-colors',
                        isActive
                          ? 'border-brand/40 bg-brand/15 text-brand-strong'
                          : 'border-line-strong bg-surface-2 text-muted group-hover:text-ink',
                      )}
                    >
                      {ws.name.trim().charAt(0) || '?'}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{ws.name}</span>
                    {ws.membersCount > 0 && (
                      <span className="shrink-0 text-[11px] tabular-nums text-faint">
                        {ws.membersCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar name={user?.name ?? 'You'} seed={user?.id} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[11.5px] text-faint">{user?.email}</p>
          </div>
          <IconButton icon="logout" label="Sign out" size="sm" onClick={logout} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="animate-fade fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static rail on desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[264px] border-r border-line bg-panel transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Sidebar"
      >
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-canvas/80 px-4 backdrop-blur-xl sm:px-6">
          <IconButton
            icon="menu"
            label="Open menu"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          />
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden" aria-label="Cobly">
            <img src="/favicon.svg" alt="" width={22} height={22} className="rounded" />
            <span className="font-display text-base font-semibold">Cobly</span>
          </Link>

          <div className="relative ml-auto" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                const next = !showNotifications;
                setShowNotifications(next);
                if (next) fetchNotifications();
              }}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Icon name="bell" size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--color-danger),var(--color-danger-600))] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-canvas">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="animate-scale-in absolute right-0 mt-2 flex max-h-[75vh] w-[min(22rem,calc(100vw-2rem))] origin-top-right flex-col overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[var(--shadow-pop)]"
                role="dialog"
                aria-label="Notifications"
              >
                <span aria-hidden className="signal-line h-px w-full" />
                <div className="flex items-center justify-between px-4 py-3">
                  <h2 className="font-display text-sm font-semibold text-ink">Notifications</h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[12px] font-medium text-brand transition-colors hover:text-brand-strong"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-10 text-center">
                      <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-line-strong bg-surface-2 text-faint">
                        <Icon name="bell" size={20} />
                      </span>
                      <p className="text-sm font-medium text-ink">You’re all caught up</p>
                      <p className="mt-1 text-[12.5px] text-muted">New activity will show up here.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => navigateNotification(n)}
                            className={cn(
                              'group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
                              !n.read && 'bg-brand/[0.05]',
                            )}
                          >
                            <span className="mt-1.5 flex h-2 w-2 shrink-0">
                              {!n.read && (
                                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span
                                  className={cn(
                                    'text-[13px] leading-snug',
                                    n.read ? 'font-medium text-muted' : 'font-semibold text-ink',
                                  )}
                                >
                                  {n.title}
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                  {!n.read && (
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => handleMarkRead(n.id, e)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          handleMarkRead(n.id, e as unknown as React.MouseEvent);
                                        }
                                      }}
                                      className="rounded-md p-1 text-faint opacity-0 transition-opacity hover:text-brand focus:opacity-100 group-hover:opacity-100"
                                      aria-label="Mark as read"
                                      title="Mark as read"
                                    >
                                      <Icon name="check" size={14} />
                                    </span>
                                  )}
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => handleDeleteNotification(n.id, e)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        handleDeleteNotification(
                                          n.id,
                                          e as unknown as React.MouseEvent,
                                        );
                                      }
                                    }}
                                    className="rounded-md p-1 text-faint opacity-0 transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
                                    aria-label="Remove notification"
                                    title="Remove"
                                  >
                                    <Icon name="close" size={14} />
                                  </span>
                                </span>
                              </span>
                              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted line-clamp-2">
                                {n.message}
                              </span>
                              <span className="mt-1 block text-[11px] text-faint">
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet
              context={{
                workspaces,
                workspacesLoading: isLoading,
                workspacesError: loadError,
                refreshWorkspaces: fetchWorkspaces,
                openCreateWorkspace: openCreate,
              }}
            />
          </div>
        </main>
      </div>

      {/* Create workspace */}
      <Modal
        open={isCreating}
        onClose={() => !submitting && setIsCreating(false)}
        title="Create workspace"
        description="Workspaces group your projects, members, and discussions."
        icon="workspaces"
        size="sm"
        dismissOnBackdrop={!submitting}
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsCreating(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-workspace-form"
              loading={submitting}
              disabled={!newWsName.trim()}
            >
              Create workspace
            </Button>
          </>
        }
      >
        <form id="create-workspace-form" onSubmit={handleCreateWorkspace} className="space-y-4">
          <Field htmlFor="new-ws-name" label="Name" required>
            <Input
              id="new-ws-name"
              data-autofocus
              required
              placeholder="e.g. Product, Marketing, Q3 Launch"
              value={newWsName}
              maxLength={80}
              onChange={(e) => setNewWsName(e.target.value)}
            />
          </Field>
          <Field htmlFor="new-ws-desc" label="Description" hint="Optional — a short line of context.">
            <Textarea
              id="new-ws-desc"
              rows={3}
              placeholder="What is this workspace for?"
              value={newWsDesc}
              maxLength={280}
              onChange={(e) => setNewWsDesc(e.target.value)}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
