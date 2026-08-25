import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { discussionApi, commentApi } from '../services/discussion';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Discussion, Comment } from '../types/discussion';
import type { WorkspaceMember } from '../types/workspace';
import type { Project } from '../types/project';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, formatRelativeTime } from '../utils/datetime';
import {
  Avatar,
  Breadcrumbs,
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
  Skeleton,
  Textarea,
  useToast,
} from '../ui';

export function DiscussionDetail() {
  const { workspaceId, projectId, discussionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Discussion edit
  const [isEditingDiscussion, setIsEditingDiscussion] = useState(false);
  const [savingDiscussion, setSavingDiscussion] = useState(false);
  const [edTitle, setEdTitle] = useState('');
  const [edContent, setEdContent] = useState('');
  const [confirmDeleteDiscussion, setConfirmDeleteDiscussion] = useState(false);
  const [deletingDiscussion, setDeletingDiscussion] = useState(false);

  // Comment compose / edit / delete
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId || !projectId || !discussionId) return;
    setIsLoading(true);
    setError('');
    try {
      const [wsData, projData, discData, commData, memData] = await Promise.all([
        workspaceApi.get(workspaceId),
        projectApi.get(workspaceId, projectId),
        discussionApi.get(workspaceId, projectId, discussionId),
        commentApi.list(workspaceId, projectId, discussionId),
        workspaceApi.getMembers(workspaceId),
      ]);
      setWorkspaceName(wsData.workspace.name);
      setProject(projData.project);
      setDiscussion(discData.discussion);
      setComments(commData.comments);
      setMembers(memData.members);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load this discussion.');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId, discussionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ---- Discussion handlers ---- */
  const openEditDiscussion = () => {
    if (!discussion) return;
    setEdTitle(discussion.title);
    setEdContent(discussion.content);
    setIsEditingDiscussion(true);
  };

  const handleUpdateDiscussion = async (e: FormEvent) => {
    e.preventDefault();
    if (!edTitle.trim() || !edContent.trim() || savingDiscussion) return;
    setSavingDiscussion(true);
    try {
      const res = await discussionApi.update(workspaceId!, projectId!, discussionId!, {
        title: edTitle.trim(),
        content: edContent.trim(),
      });
      setDiscussion(res.discussion);
      setIsEditingDiscussion(false);
      toast.success('Discussion updated.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update discussion.');
    } finally {
      setSavingDiscussion(false);
    }
  };

  const confirmDiscussionDelete = async () => {
    setDeletingDiscussion(true);
    try {
      await discussionApi.delete(workspaceId!, projectId!, discussionId!);
      toast.success('Discussion deleted.');
      navigate(`/dashboard/workspaces/${workspaceId}/projects/${projectId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete discussion.');
      setDeletingDiscussion(false);
      setConfirmDeleteDiscussion(false);
    }
  };

  /* ---- Comment handlers ---- */
  const handleCreateComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await commentApi.create(workspaceId!, projectId!, discussionId!, {
        content: newComment.trim(),
      });
      setComments((cs) => [...cs, res.comment]);
      setNewComment('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setPostingComment(false);
    }
  };

  const openEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
  };

  const handleUpdateComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editCommentText.trim() || savingComment) return;
    setSavingComment(true);
    try {
      const res = await commentApi.update(
        workspaceId!,
        projectId!,
        discussionId!,
        editingComment.id,
        { content: editCommentText.trim() },
      );
      setComments((cs) => cs.map((c) => (c.id === res.comment.id ? res.comment : c)));
      setEditingComment(null);
      setEditCommentText('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const confirmCommentDelete = async () => {
    if (!commentToDelete) return;
    setDeletingComment(true);
    try {
      await commentApi.delete(workspaceId!, projectId!, discussionId!, commentToDelete.id);
      setComments((cs) => cs.filter((c) => c.id !== commentToDelete.id));
      setCommentToDelete(null);
      toast.success('Comment deleted.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment.');
    } finally {
      setDeletingComment(false);
    }
  };

  /* ---- Render ---- */
  if (isLoading) return <DiscussionSkeleton />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }
  if (!discussion || !project) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <EmptyState
          icon="discussion"
          title="Discussion not found"
          message="This discussion may have been deleted or you no longer have access."
          action={
            <Link to={`/dashboard/workspaces/${workspaceId}/projects/${projectId}`}>
              <Button variant="secondary" leftIcon="arrow-left">
                Back to project
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isWorkspaceOwner = members.find((m) => m.user.id === user?.id)?.role === 'owner';
  const isProjectOwner = project.owner === user?.id;
  const canModifyDiscussion =
    isWorkspaceOwner || isProjectOwner || discussion.author.id === user?.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: workspaceName || 'Workspace', to: `/dashboard/workspaces/${workspaceId}` },
          {
            label: project.name,
            to: `/dashboard/workspaces/${workspaceId}/projects/${projectId}`,
          },
          { label: discussion.title },
        ]}
      />

      {/* Main post */}
      <Card signal className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 font-display text-2xl font-semibold leading-tight text-ink">
            {discussion.title}
          </h1>
          {canModifyDiscussion && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" leftIcon="edit" onClick={openEditDiscussion}>
                Edit
              </Button>
              <Button
                variant="subtle"
                size="sm"
                leftIcon="trash"
                onClick={() => setConfirmDeleteDiscussion(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Avatar name={discussion.author.name} seed={discussion.author.id} size="sm" />
          <span className="text-[13.5px] font-medium text-ink">{discussion.author.name}</span>
          <span className="text-faint">·</span>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-faint">
            <Icon name="clock" size={13} />
            {formatDateTime(discussion.createdAt)}
          </span>
        </div>

        <div className="mt-5 whitespace-pre-wrap border-t border-line pt-5 text-[15px] leading-relaxed text-ink/90">
          {discussion.content}
        </div>
      </Card>

      {/* Comments */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Icon name="discussion" size={17} className="text-faint" />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>

        {comments.length === 0 ? (
          <EmptyState
            icon="discussion"
            title="No comments yet"
            message="Be the first to reply and keep the conversation going."
          />
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => {
              const canModifyComment =
                isWorkspaceOwner || isProjectOwner || comment.author.id === user?.id;
              const edited = comment.updatedAt !== comment.createdAt;
              const isEditing = editingComment?.id === comment.id;

              return (
                <li key={comment.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={comment.author.name} seed={comment.author.id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {comment.author.name}
                          {comment.author.id === user?.id && (
                            <span className="ml-1.5 text-[11px] font-normal text-faint">You</span>
                          )}
                        </p>
                        <p className="text-[11.5px] text-faint">
                          {formatRelativeTime(comment.createdAt)}
                          {edited && <span className="italic"> · edited</span>}
                        </p>
                      </div>
                      {canModifyComment && !isEditing && (
                        <div className="ml-auto flex shrink-0 items-center gap-0.5">
                          <IconButton
                            icon="edit"
                            label="Edit comment"
                            size="sm"
                            onClick={() => openEditComment(comment)}
                            className="text-faint hover:text-ink"
                          />
                          <IconButton
                            icon="trash"
                            label="Delete comment"
                            size="sm"
                            onClick={() => setCommentToDelete(comment)}
                            className="text-faint hover:text-danger"
                          />
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleUpdateComment} className="mt-3 space-y-2.5">
                        <Textarea
                          aria-label="Edit comment"
                          required
                          rows={3}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          disabled={savingComment}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => setEditingComment(null)}
                            disabled={savingComment}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            loading={savingComment}
                            disabled={!editCommentText.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                        {comment.content}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {/* Composer */}
        <Card className="p-4 sm:p-5">
          <form onSubmit={handleCreateComment} className="space-y-3">
            <Field htmlFor="new-comment" label="Add a comment">
              <Textarea
                id="new-comment"
                required
                rows={4}
                placeholder="Share your thoughts…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={postingComment}
              />
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                leftIcon="send"
                loading={postingComment}
                disabled={!newComment.trim()}
              >
                Post comment
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* Edit discussion modal */}
      <Modal
        open={isEditingDiscussion}
        onClose={() => !savingDiscussion && setIsEditingDiscussion(false)}
        title="Edit discussion"
        icon="edit"
        size="lg"
        dismissOnBackdrop={!savingDiscussion}
        footer={
          <>
            <Button
              variant="subtle"
              onClick={() => setIsEditingDiscussion(false)}
              disabled={savingDiscussion}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-discussion-form"
              loading={savingDiscussion}
              disabled={!edTitle.trim() || !edContent.trim()}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form id="edit-discussion-form" onSubmit={handleUpdateDiscussion} className="space-y-4">
          <Field htmlFor="ed-title" label="Title" required>
            <Input
              id="ed-title"
              data-autofocus
              required
              value={edTitle}
              maxLength={200}
              onChange={(e) => setEdTitle(e.target.value)}
            />
          </Field>
          <Field htmlFor="ed-content" label="Message" required>
            <Textarea
              id="ed-content"
              required
              rows={8}
              value={edContent}
              onChange={(e) => setEdContent(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      {/* Confirm: delete discussion */}
      <ConfirmDialog
        open={confirmDeleteDiscussion}
        onClose={() => !deletingDiscussion && setConfirmDeleteDiscussion(false)}
        onConfirm={confirmDiscussionDelete}
        loading={deletingDiscussion}
        title="Delete discussion"
        message={
          <>
            Delete <span className="font-medium text-ink">{discussion.title}</span> and all its
            comments? This cannot be undone.
          </>
        }
        confirmLabel="Delete discussion"
      />

      {/* Confirm: delete comment */}
      <ConfirmDialog
        open={!!commentToDelete}
        onClose={() => !deletingComment && setCommentToDelete(null)}
        onConfirm={confirmCommentDelete}
        loading={deletingComment}
        title="Delete comment"
        message="Delete this comment? This cannot be undone."
        confirmLabel="Delete comment"
      />
    </div>
  );
}

function DiscussionSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-3.5 w-72 max-w-full" />
      <Card className="space-y-4 p-6 sm:p-7">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2 border-t border-line pt-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
      <Skeleton className="h-5 w-32" />
      {[0, 1].map((i) => (
        <Card key={i} className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  );
}
