import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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
import { formatDate, formatRelativeTime, toDatetimeLocalValue } from '../utils/datetime';
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconButton,
  Input,
  Modal,
  PageHeader,
  PriorityBadge,
  ProjectStatusBadge,
  Select,
  Skeleton,
  TaskStatusBadge,
  Textarea,
  cn,
  useToast,
} from '../ui';

type TabKey = 'tasks' | 'discussions';

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
];

export function ProjectDetail() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  // Project edit
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [epName, setEpName] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epStatus, setEpStatus] = useState('active');
  const [epDeadline, setEpDeadline] = useState('');
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Task create
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [ntTitle, setNtTitle] = useState('');
  const [ntDesc, setNtDesc] = useState('');
  const [ntStatus, setNtStatus] = useState<TaskStatus>('todo');
  const [ntPriority, setNtPriority] = useState<TaskPriority>('medium');
  const [ntDueDate, setNtDueDate] = useState('');
  const [ntAssignee, setNtAssignee] = useState('');

  // Task edit
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [etTitle, setEtTitle] = useState('');
  const [etDesc, setEtDesc] = useState('');
  const [etStatus, setEtStatus] = useState<TaskStatus>('todo');
  const [etPriority, setEtPriority] = useState<TaskPriority>('medium');
  const [etDueDate, setEtDueDate] = useState('');
  const [etAssignee, setEtAssignee] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  // Discussion create
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  const [creatingDiscussion, setCreatingDiscussion] = useState(false);
  const [ndTitle, setNdTitle] = useState('');
  const [ndContent, setNdContent] = useState('');

  const loadData = useCallback(async () => {
    if (!workspaceId || !projectId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, projData, tasksData, discData, memData] = await Promise.all([
        workspaceApi.get(workspaceId),
        projectApi.get(workspaceId, projectId),
        taskApi.list(workspaceId, projectId),
        discussionApi.list(workspaceId, projectId),
        workspaceApi.getMembers(workspaceId),
      ]);
      setWorkspaceName(wsData.workspace.name);
      setProject(projData.project);
      setTasks(tasksData.tasks);
      setDiscussions(discData.discussions);
      setMembers(memData.members);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load this project.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- Project handlers ---- */
  const openEditProject = () => {
    if (!project) return;
    setEpName(project.name);
    setEpDesc(project.description || '');
    setEpStatus(project.status);
    setEpDeadline(project.deadline ? toDatetimeLocalValue(project.deadline) : '');
    setIsEditingProject(true);
  };

  const handleUpdateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!epName.trim() || savingProject) return;
    setSavingProject(true);
    try {
      const res = await projectApi.update(workspaceId!, projectId!, {
        name: epName.trim(),
        description: epDesc.trim(),
        status: epStatus,
        deadline: epDeadline ? new Date(epDeadline).toISOString() : undefined,
      });
      setProject(res.project);
      setIsEditingProject(false);
      toast.success('Project updated.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update project.');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      await projectApi.delete(workspaceId!, projectId!);
      toast.success('Project deleted.');
      navigate(`/dashboard/workspaces/${workspaceId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project.');
      setDeletingProject(false);
      setConfirmDeleteProject(false);
    }
  };

  /* ---- Task handlers ---- */
  const openCreateTask = (status: TaskStatus = 'todo') => {
    setNtTitle('');
    setNtDesc('');
    setNtStatus(status);
    setNtPriority('medium');
    setNtDueDate('');
    setNtAssignee('');
    setIsCreatingTask(true);
  };

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!ntTitle.trim() || creatingTask) return;
    setCreatingTask(true);
    try {
      const res = await taskApi.create(workspaceId!, projectId!, {
        title: ntTitle.trim(),
        description: ntDesc.trim() || undefined,
        status: ntStatus,
        priority: ntPriority,
        dueDate: ntDueDate ? new Date(ntDueDate).toISOString() : undefined,
        assignee: ntAssignee || undefined,
      });
      setTasks((ts) => [...ts, res.task]);
      setIsCreatingTask(false);
      toast.success('Task created.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setCreatingTask(false);
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEtTitle(task.title);
    setEtDesc(task.description || '');
    setEtStatus(task.status);
    setEtPriority(task.priority);
    setEtDueDate(task.dueDate ? toDatetimeLocalValue(task.dueDate) : '');
    setEtAssignee(task.assignee?.id || '');
  };

  const handleUpdateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTask || !etTitle.trim() || savingTask) return;
    setSavingTask(true);
    try {
      const res = await taskApi.update(workspaceId!, projectId!, editingTask.id, {
        title: etTitle.trim(),
        description: etDesc.trim(),
        status: etStatus,
        priority: etPriority,
        dueDate: etDueDate ? new Date(etDueDate).toISOString() : undefined,
        assignee: etAssignee || null,
      });
      setTasks((ts) => ts.map((t) => (t.id === res.task.id ? res.task : t)));
      setEditingTask(null);
      toast.success('Task updated.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setSavingTask(false);
    }
  };

  const requestDeleteTask = () => {
    if (!editingTask) return;
    setTaskToDelete(editingTask);
    setEditingTask(null);
  };

  const confirmTaskDelete = async () => {
    if (!taskToDelete) return;
    setDeletingTask(true);
    try {
      await taskApi.delete(workspaceId!, projectId!, taskToDelete.id);
      setTasks((ts) => ts.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null);
      toast.success('Task deleted.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task.');
    } finally {
      setDeletingTask(false);
    }
  };

  const moveTask = async (task: Task, dir: -1 | 1) => {
    const idx = COLUMNS.findIndex((c) => c.status === task.status);
    const target = COLUMNS[idx + dir];
    if (!target) return;
    const snapshot = tasks;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: target.status } : t)));
    try {
      const res = await taskApi.update(workspaceId!, projectId!, task.id, {
        status: target.status,
      });
      setTasks((ts) => ts.map((t) => (t.id === task.id ? res.task : t)));
    } catch (err: unknown) {
      setTasks(snapshot);
      toast.error(err instanceof Error ? err.message : 'Failed to move task.');
    }
  };

  /* ---- Discussion handlers ---- */
  const handleCreateDiscussion = async (e: FormEvent) => {
    e.preventDefault();
    if (!ndTitle.trim() || !ndContent.trim() || creatingDiscussion) return;
    setCreatingDiscussion(true);
    try {
      const res = await discussionApi.create(workspaceId!, projectId!, {
        title: ndTitle.trim(),
        content: ndContent.trim(),
      });
      setDiscussions((ds) => [res.discussion, ...ds]);
      setIsCreatingDiscussion(false);
      setNdTitle('');
      setNdContent('');
      toast.success('Discussion started.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start discussion.');
    } finally {
      setCreatingDiscussion(false);
    }
  };

  /* ---- Render ---- */
  if (isLoading) return <ProjectSkeleton />;
  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }
  if (!project) {
    return (
      <div className="py-8">
        <EmptyState
          icon="folder"
          title="Project not found"
          message="This project may have been deleted or you no longer have access."
          action={
            <Link to={`/dashboard/workspaces/${workspaceId}`}>
              <Button variant="secondary" leftIcon="arrow-left">
                Back to workspace
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isWorkspaceOwner = members.find((m) => m.id === user?.id)?.role === 'owner';
  const isProjectOwner = project.owner === user?.id;
  const canEditProject = isWorkspaceOwner || isProjectOwner;

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'discussions', label: 'Discussions', count: discussions.length },
  ];

  return (
    <div className="space-y-7">
      <PageHeaderBlock
        workspaceId={workspaceId!}
        workspaceName={workspaceName}
        project={project}
        taskCount={tasks.length}
        discussionCount={discussions.length}
        canEdit={canEditProject}
        onEdit={openEditProject}
        onDelete={() => setConfirmDeleteProject(true)}
      />

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="-mb-px flex gap-1" role="tablist" aria-label="Project sections">
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
                  active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                    active ? 'bg-brand/15 text-brand-strong' : 'bg-white/[0.05] text-faint',
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks / Board */}
      {activeTab === 'tasks' && (
        <section className="animate-fade">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Board</h2>
              <p className="mt-0.5 text-[13px] text-faint">
                Use the arrows on a card to move it between columns.
              </p>
            </div>
            <Button size="sm" leftIcon="plus" onClick={() => openCreateTask('todo')}>
              New task
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col, colIndex) => {
              const columnTasks = tasks.filter((t) => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="flex flex-col rounded-2xl border border-line bg-panel/40 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <TaskStatusBadge status={col.status} />
                    <span className="text-[11px] tabular-nums text-faint">{columnTasks.length}</span>
                  </div>

                  <ul className="space-y-2.5">
                    {columnTasks.map((task) => (
                      <li key={task.id}>
                        <div className="rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
                          <button
                            type="button"
                            onClick={() => openEditTask(task)}
                            className="block w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                          >
                            <p className="text-[13.5px] font-medium leading-snug text-ink">
                              {task.title}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <PriorityBadge priority={task.priority} />
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1 text-[11.5px] text-faint">
                                  <Icon name="clock" size={12} />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                            {task.assignee ? (
                              <span className="flex min-w-0 items-center gap-1.5">
                                <Avatar
                                  name={task.assignee.name}
                                  seed={task.assignee.id}
                                  size="xs"
                                />
                                <span className="truncate text-[11.5px] text-muted">
                                  {task.assignee.name}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint">
                                <span className="grid h-5 w-5 place-items-center rounded-full border border-dashed border-line-strong">
                                  <Icon name="user" size={11} />
                                </span>
                                Unassigned
                              </span>
                            )}

                            <span className="flex items-center gap-0.5">
                              <IconButton
                                icon="chevron-left"
                                size="sm"
                                label={
                                  colIndex > 0
                                    ? `Move to ${COLUMNS[colIndex - 1].label}`
                                    : 'Already in first column'
                                }
                                disabled={colIndex === 0}
                                onClick={() => moveTask(task, -1)}
                                className="text-faint hover:text-brand disabled:opacity-30"
                              />
                              <IconButton
                                icon="chevron-right"
                                size="sm"
                                label={
                                  colIndex < COLUMNS.length - 1
                                    ? `Move to ${COLUMNS[colIndex + 1].label}`
                                    : 'Already in last column'
                                }
                                disabled={colIndex === COLUMNS.length - 1}
                                onClick={() => moveTask(task, 1)}
                                className="text-faint hover:text-brand disabled:opacity-30"
                              />
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openCreateTask(col.status)}
                    className={cn(
                      'flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong/70 py-2 text-[12.5px] font-medium text-faint transition-colors hover:border-brand/50 hover:text-brand',
                      columnTasks.length > 0 && 'mt-2.5',
                    )}
                  >
                    <Icon name="plus" size={14} />
                    Add task
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Discussions */}
      {activeTab === 'discussions' && (
        <section className="animate-fade">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Discussions</h2>
            <Button size="sm" leftIcon="plus" onClick={() => setIsCreatingDiscussion(true)}>
              New discussion
            </Button>
          </div>

          {discussions.length === 0 ? (
            <EmptyState
              icon="discussion"
              title="No discussions yet"
              message="Start a discussion to capture decisions and context where the work lives."
              action={
                <Button leftIcon="plus" onClick={() => setIsCreatingDiscussion(true)}>
                  New discussion
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {discussions.map((discussion) => (
                <Link
                  key={discussion.id}
                  to={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/discussions/${discussion.id}`}
                  className="group block"
                >
                  <Card hover className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 truncate font-display text-[15px] font-semibold text-ink">
                        {discussion.title}
                      </h3>
                      <Icon
                        name="arrow-right"
                        size={16}
                        className="mt-0.5 shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                      {discussion.content}
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                      <Avatar name={discussion.author.name} seed={discussion.author.id} size="xs" />
                      <span className="truncate text-[12.5px] text-muted">
                        {discussion.author.name}
                      </span>
                      <span className="ml-auto shrink-0 text-[11.5px] text-faint">
                        {formatRelativeTime(discussion.updatedAt)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Create task modal */}
      <Modal
        open={isCreatingTask}
        onClose={() => !creatingTask && setIsCreatingTask(false)}
        title="Create task"
        icon="check-square"
        size="md"
        dismissOnBackdrop={!creatingTask}
        footer={
          <>
            <Button variant="subtle" onClick={() => setIsCreatingTask(false)} disabled={creatingTask}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-task-form"
              loading={creatingTask}
              disabled={!ntTitle.trim()}
            >
              Create task
            </Button>
          </>
        }
      >
        <form id="create-task-form" onSubmit={handleCreateTask} className="space-y-4">
          <Field htmlFor="nt-title" label="Title" required>
            <Input
              id="nt-title"
              data-autofocus
              required
              placeholder="e.g. Draft launch checklist"
              value={ntTitle}
              maxLength={200}
              onChange={(e) => setNtTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="nt-desc" label="Description" hint="Optional.">
            <Textarea
              id="nt-desc"
              rows={3}
              placeholder="Add any details…"
              value={ntDesc}
              onChange={(e) => setNtDesc(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="nt-status" label="Status">
              <Select
                id="nt-status"
                value={ntStatus}
                onChange={(e) => setNtStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
            <Field htmlFor="nt-priority" label="Priority">
              <Select
                id="nt-priority"
                value={ntPriority}
                onChange={(e) => setNtPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field htmlFor="nt-assignee" label="Assignee">
              <Select
                id="nt-assignee"
                value={ntAssignee}
                onChange={(e) => setNtAssignee(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="nt-due" label="Due date" hint="Optional.">
              <Input
                id="nt-due"
                type="datetime-local"
                value={ntDueDate}
                onChange={(e) => setNtDueDate(e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Edit task modal */}
      <Modal
        open={!!editingTask}
        onClose={() => !savingTask && setEditingTask(null)}
        title="Edit task"
        icon="edit"
        size="md"
        dismissOnBackdrop={!savingTask}
        footer={
          <>
            <Button
              variant="ghost"
              leftIcon="trash"
              onClick={requestDeleteTask}
              disabled={savingTask}
              className="mr-auto text-muted hover:text-danger"
            >
              Delete
            </Button>
            <Button variant="subtle" onClick={() => setEditingTask(null)} disabled={savingTask}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-task-form"
              loading={savingTask}
              disabled={!etTitle.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-task-form" onSubmit={handleUpdateTask} className="space-y-4">
          <Field htmlFor="et-title" label="Title" required>
            <Input
              id="et-title"
              data-autofocus
              required
              value={etTitle}
              maxLength={200}
              onChange={(e) => setEtTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="et-desc" label="Description" hint="Optional.">
            <Textarea
              id="et-desc"
              rows={3}
              value={etDesc}
              onChange={(e) => setEtDesc(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="et-status" label="Status">
              <Select
                id="et-status"
                value={etStatus}
                onChange={(e) => setEtStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </Select>
            </Field>
            <Field htmlFor="et-priority" label="Priority">
              <Select
                id="et-priority"
                value={etPriority}
                onChange={(e) => setEtPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field htmlFor="et-assignee" label="Assignee">
              <Select
                id="et-assignee"
                value={etAssignee}
                onChange={(e) => setEtAssignee(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="et-due" label="Due date" hint="Optional.">
              <Input
                id="et-due"
                type="datetime-local"
                value={etDueDate}
                onChange={(e) => setEtDueDate(e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Edit project modal */}
      <Modal
        open={isEditingProject}
        onClose={() => !savingProject && setIsEditingProject(false)}
        title="Edit project"
        icon="folder"
        size="sm"
        dismissOnBackdrop={!savingProject}
        footer={
          <>
            <Button
              variant="subtle"
              onClick={() => setIsEditingProject(false)}
              disabled={savingProject}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-project-form"
              loading={savingProject}
              disabled={!epName.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-project-form" onSubmit={handleUpdateProject} className="space-y-4">
          <Field htmlFor="ep-name" label="Name" required>
            <Input
              id="ep-name"
              data-autofocus
              required
              value={epName}
              maxLength={120}
              onChange={(e) => setEpName(e.target.value)}
            />
          </Field>
          <Field htmlFor="ep-desc" label="Description" hint="Optional.">
            <Textarea
              id="ep-desc"
              rows={3}
              value={epDesc}
              onChange={(e) => setEpDesc(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="ep-status" label="Status">
              <Select id="ep-status" value={epStatus} onChange={(e) => setEpStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <Field htmlFor="ep-deadline" label="Deadline" hint="Optional.">
              <Input
                id="ep-deadline"
                type="datetime-local"
                value={epDeadline}
                onChange={(e) => setEpDeadline(e.target.value)}
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Create discussion modal */}
      <Modal
        open={isCreatingDiscussion}
        onClose={() => !creatingDiscussion && setIsCreatingDiscussion(false)}
        title="Start a discussion"
        description="Kick off a conversation attached to this project."
        icon="discussion"
        size="md"
        dismissOnBackdrop={!creatingDiscussion}
        footer={
          <>
            <Button
              variant="subtle"
              onClick={() => setIsCreatingDiscussion(false)}
              disabled={creatingDiscussion}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-discussion-form"
              loading={creatingDiscussion}
              disabled={!ndTitle.trim() || !ndContent.trim()}
            >
              Post discussion
            </Button>
          </>
        }
      >
        <form id="create-discussion-form" onSubmit={handleCreateDiscussion} className="space-y-4">
          <Field htmlFor="nd-title" label="Title" required>
            <Input
              id="nd-title"
              data-autofocus
              required
              placeholder="What’s this about?"
              value={ndTitle}
              maxLength={200}
              onChange={(e) => setNdTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="nd-content" label="Message" required>
            <Textarea
              id="nd-content"
              required
              rows={6}
              placeholder="Share the context, question, or decision…"
              value={ndContent}
              onChange={(e) => setNdContent(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      {/* Confirm: delete task */}
      <ConfirmDialog
        open={!!taskToDelete}
        onClose={() => !deletingTask && setTaskToDelete(null)}
        onConfirm={confirmTaskDelete}
        loading={deletingTask}
        title="Delete task"
        message={
          <>
            Delete <span className="font-medium text-ink">{taskToDelete?.title}</span>? This can’t be
            undone.
          </>
        }
        confirmLabel="Delete task"
      />

      {/* Confirm: delete project */}
      <ConfirmDialog
        open={confirmDeleteProject}
        onClose={() => !deletingProject && setConfirmDeleteProject(false)}
        onConfirm={handleDeleteProject}
        loading={deletingProject}
        title="Delete project"
        message={
          <>
            Permanently delete <span className="font-medium text-ink">{project.name}</span>? This
            removes all its tasks and discussions. This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
      />
    </div>
  );
}

/* ---- Header block (kept local: specific to this page) ---- */
function PageHeaderBlock({
  workspaceId,
  workspaceName,
  project,
  taskCount,
  discussionCount,
  canEdit,
  onEdit,
  onDelete,
}: {
  workspaceId: string;
  workspaceName: string;
  project: Project;
  taskCount: number;
  discussionCount: number;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Home', to: '/dashboard' },
        { label: workspaceName || 'Workspace', to: `/dashboard/workspaces/${workspaceId}` },
        { label: project.name },
      ]}
      title={project.name}
      description={project.description || 'No description provided.'}
      actions={
        canEdit ? (
          <>
            <Button variant="secondary" leftIcon="edit" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="subtle" leftIcon="trash" onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : undefined
      }
      meta={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
          <ProjectStatusBadge status={project.status} />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check-square" size={15} className="text-faint" />
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="discussion" size={15} className="text-faint" />
            {discussionCount} {discussionCount === 1 ? 'discussion' : 'discussions'}
          </span>
          {project.deadline && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={15} className="text-faint" />
              Due {formatDate(project.deadline)}
            </span>
          )}
        </div>
      }
    />
  );
}

function ProjectSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-56" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <div className="flex gap-4 border-b border-line pb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((col) => (
          <div key={col} className="rounded-2xl border border-line bg-panel/40 p-3">
            <Skeleton className="mb-3 h-6 w-24 rounded-full" />
            <div className="space-y-2.5">
              {[0, 1].map((c) => (
                <Card key={c} className="space-y-3 p-3">
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
