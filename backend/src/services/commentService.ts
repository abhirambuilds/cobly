import mongoose from 'mongoose';
import Comment, { IComment } from '../models/Comment';
import Discussion from '../models/Discussion';
import Project from '../models/Project';
import Workspace from '../models/Workspace';
import { IUser } from '../models/User';
import { ActivityService } from './activityService';

export interface SafeComment {
  id: string;
  workspaceId: string;
  projectId: string;
  discussionId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentService {
  static toSafeComment(comment: IComment): SafeComment {
    let safeAuthor = { id: '', name: 'Unknown', email: 'Unknown' };
    
    if (comment.author) {
      if (typeof comment.author === 'object' && '_id' in comment.author) {
        const user = comment.author as unknown as IUser;
        safeAuthor = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      } else {
        safeAuthor.id = (comment.author as mongoose.Types.ObjectId).toString();
      }
    }

    return {
      id: comment._id.toString(),
      workspaceId: comment.workspaceId.toString(),
      projectId: comment.projectId.toString(),
      discussionId: comment.discussionId.toString(),
      author: safeAuthor,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  private static async getContext(workspaceId: string, projectId: string, discussionId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');

    const member = workspace.members.find(m => m.user.toString() === userId);
    
    const project = await Project.findOne({ 
      _id: new mongoose.Types.ObjectId(projectId), 
      workspaceId: new mongoose.Types.ObjectId(workspaceId) 
    });
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    const discussion = await Discussion.findOne({
      _id: new mongoose.Types.ObjectId(discussionId),
      projectId: new mongoose.Types.ObjectId(projectId),
      workspaceId: new mongoose.Types.ObjectId(workspaceId)
    });
    if (!discussion) throw new Error('DISCUSSION_NOT_FOUND');

    return {
      isWorkspaceMember: !!member,
      isWorkspaceOwner: member?.role === 'owner',
      isProjectOwner: project.owner.toString() === userId,
      workspace
    };
  }

  static async createComment(
    workspaceId: string, 
    projectId: string, 
    discussionId: string,
    userId: string, 
    data: { content: string }
  ): Promise<SafeComment> {
    const context = await this.getContext(workspaceId, projectId, discussionId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const comment = new Comment({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      projectId: new mongoose.Types.ObjectId(projectId),
      discussionId: new mongoose.Types.ObjectId(discussionId),
      author: new mongoose.Types.ObjectId(userId),
      content: data.content,
    });

    await comment.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'comment_created',
      entityType: 'comment',
      entityId: comment._id.toString(),
      metadata: { discussionId }
    });

    await comment.populate('author', 'name email');
    return this.toSafeComment(comment);
  }

  static async getCommentsByDiscussion(
    workspaceId: string, 
    projectId: string, 
    discussionId: string,
    userId: string
  ): Promise<SafeComment[]> {
    const context = await this.getContext(workspaceId, projectId, discussionId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const comments = await Comment.find({ discussionId: new mongoose.Types.ObjectId(discussionId) })
      .sort({ createdAt: 1 })
      .populate('author', 'name email');

    return comments.map(c => this.toSafeComment(c));
  }

  static async updateComment(
    workspaceId: string, 
    projectId: string, 
    discussionId: string,
    commentId: string,
    userId: string, 
    data: { content?: string }
  ): Promise<SafeComment> {
    const context = await this.getContext(workspaceId, projectId, discussionId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const comment = await Comment.findOne({ 
      _id: new mongoose.Types.ObjectId(commentId), 
      discussionId: new mongoose.Types.ObjectId(discussionId) 
    });

    if (!comment) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    const isCommentAuthor = comment.author.toString() === userId;
    const isOwner = context.isWorkspaceOwner || context.isProjectOwner;

    if (!isCommentAuthor && !isOwner) {
      throw new Error('FORBIDDEN');
    }

    const changes: any = {};
    if (data.content !== undefined) { comment.content = data.content; changes.content = true; }

    await comment.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'comment_updated',
      entityType: 'comment',
      entityId: comment._id.toString(),
      metadata: changes
    });

    await comment.populate('author', 'name email');
    return this.toSafeComment(comment);
  }

  static async deleteComment(
    workspaceId: string, 
    projectId: string, 
    discussionId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const context = await this.getContext(workspaceId, projectId, discussionId, userId);
    
    const comment = await Comment.findOne({ 
      _id: new mongoose.Types.ObjectId(commentId), 
      discussionId: new mongoose.Types.ObjectId(discussionId) 
    });

    if (!comment) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    const isCommentAuthor = comment.author.toString() === userId;
    const isOwner = context.isWorkspaceOwner || context.isProjectOwner;

    if (!isCommentAuthor && !isOwner) {
      throw new Error('FORBIDDEN');
    }

    await Comment.deleteOne({ _id: comment._id });
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'comment_deleted',
      entityType: 'comment',
      entityId: comment._id.toString(),
      metadata: { discussionId }
    });
  }
}
