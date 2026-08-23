import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { discussionApi, commentApi } from '../services/discussion';
import { projectApi } from '../services/project';
import { workspaceApi } from '../services/workspace';
import type { Discussion, Comment } from '../types/discussion';
import type { WorkspaceMember } from '../types/workspace';
import type { Project } from '../types/project';
import { useAuth } from '../hooks/useAuth';

export function DiscussionDetail() {
  const { workspaceId, projectId, discussionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Discussion Edit State
  const [isEditingDiscussion, setIsEditingDiscussion] = useState(false);
  const [editDiscussionTitle, setEditDiscussionTitle] = useState('');
  const [editDiscussionContent, setEditDiscussionContent] = useState('');

  // Comment Create State
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');

  // Comment Edit State
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const loadData = async () => {
    if (!workspaceId || !projectId || !discussionId) return;
    setIsLoading(true);
    setError('');
    try {
      const [projData, discData, commData, memData] = await Promise.all([
        projectApi.get(workspaceId, projectId),
        discussionApi.get(workspaceId, projectId, discussionId),
        commentApi.list(workspaceId, projectId, discussionId),
        workspaceApi.getMembers(workspaceId)
      ]);
      setProject(projData.project);
      setDiscussion(discData.discussion);
      setComments(commData.comments);
      setMembers(memData.members);
      
      setEditDiscussionTitle(discData.discussion.title);
      setEditDiscussionContent(discData.discussion.content);
    } catch (err: any) {
      setError(err.message || 'Failed to load discussion details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, projectId, discussionId]);

  // Discussion Handlers
  const handleUpdateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await discussionApi.update(workspaceId!, projectId!, discussionId!, {
        title: editDiscussionTitle,
        content: editDiscussionContent
      });
      setIsEditingDiscussion(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update discussion');
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    try {
      await discussionApi.delete(workspaceId!, projectId!, discussionId!);
      navigate(`/dashboard/workspaces/${workspaceId}/projects/${projectId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete discussion');
    }
  };

  // Comment Handlers
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    setIsCreatingComment(true);
    try {
      await commentApi.create(workspaceId!, projectId!, discussionId!, {
        content: newCommentContent
      });
      setNewCommentContent('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create comment');
    } finally {
      setIsCreatingComment(false);
    }
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment || !editingComment.content.trim()) return;
    try {
      await commentApi.update(workspaceId!, projectId!, discussionId!, editingComment.id, {
        content: editingComment.content
      });
      setEditingComment(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentApi.delete(workspaceId!, projectId!, discussionId!, commentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  if (isLoading) return <div className="text-gray-500">Loading discussion...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!discussion || !project) return <div className="text-gray-500">Discussion not found</div>;

  const isWorkspaceOwner = members.find(m => m.user.id === user?.id)?.role === 'owner';
  const isProjectOwner = project.owner === user?.id;
  const isDiscussionAuthor = discussion.author.id === user?.id;
  
  const canModifyDiscussion = isWorkspaceOwner || isProjectOwner || isDiscussionAuthor;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link to={`/dashboard/workspaces/${workspaceId}/projects/${projectId}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
        &larr; Back to Project
      </Link>
      
      {/* Discussion Main Post */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{discussion.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="font-medium text-gray-900">{discussion.author.name}</span>
              <span>•</span>
              <span>{new Date(discussion.createdAt).toLocaleString()}</span>
            </div>
          </div>
          {canModifyDiscussion && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingDiscussion(true)}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={handleDeleteDiscussion}
                className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
          {discussion.content}
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Comments ({comments.length})</h3>
        
        <div className="space-y-4 mb-8">
          {comments.map(comment => {
            const isCommentAuthor = comment.author.id === user?.id;
            const canModifyComment = isWorkspaceOwner || isProjectOwner || isCommentAuthor;
            
            return (
              <div key={comment.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{comment.author.name}</span>
                    <span>•</span>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    {comment.updatedAt !== comment.createdAt && <span className="italic">(edited)</span>}
                  </div>
                  {canModifyComment && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingComment(comment)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                
                {editingComment?.id === comment.id ? (
                  <form onSubmit={handleUpdateComment} className="mt-2">
                    <textarea 
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      rows={3}
                      value={editingComment.content}
                      onChange={e => setEditingComment({...editingComment, content: e.target.value})}
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingComment(null)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Save</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-gray-800 whitespace-pre-wrap text-sm">
                    {comment.content}
                  </div>
                )}
              </div>
            );
          })}
          {comments.length === 0 && (
            <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
              No comments yet. Be the first to share your thoughts.
            </div>
          )}
        </div>

        {/* Create Comment Form */}
        <form onSubmit={handleCreateComment} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3">Add a Comment</h4>
          <textarea 
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            rows={4}
            placeholder="Write your comment here..."
            value={newCommentContent}
            onChange={e => setNewCommentContent(e.target.value)}
            disabled={isCreatingComment}
          />
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={isCreatingComment || !newCommentContent.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
            >
              {isCreatingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Discussion Modal */}
      {isEditingDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4">Edit Discussion</h3>
            <form onSubmit={handleUpdateDiscussion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editDiscussionTitle}
                  onChange={e => setEditDiscussionTitle(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows={8}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editDiscussionContent}
                  onChange={e => setEditDiscussionContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditingDiscussion(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
