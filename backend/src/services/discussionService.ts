import mongoose from 'mongoose';
import Discussion, { IDiscussion } from '../models/Discussion';
import Project from '../models/Project';
import Workspace from '../models/Workspace';
import { IUser } from '../models/User';
import { ActivityService } from './activityService';

export interface SafeDiscussion {
  id: string;
  workspaceId: string;
  projectId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DiscussionService {
  static toSafeDiscussion(discussion: IDiscussion): SafeDiscussion {
    let safeAuthor = { id: '', name: 'Unknown', email: 'Unknown' };
    
    if (discussion.author) {
      if (typeof discussion.author === 'object' && '_id' in discussion.author) {
        const user = discussion.author as unknown as IUser;
        safeAuthor = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      } else {
        safeAuthor.id = (discussion.author as mongoose.Types.ObjectId).toString();
      }
    }

    return {
      id: discussion._id.toString(),
      workspaceId: discussion.workspaceId.toString(),
      projectId: discussion.projectId.toString(),
      author: safeAuthor,
      title: discussion.title,
      content: discussion.content,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
    };
  }

  private static async getContext(workspaceId: string, projectId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');

    const member = workspace.members.find(m => m.user.toString() === userId);
    
    const project = await Project.findOne({ 
      _id: new mongoose.Types.ObjectId(projectId), 
      workspaceId: new mongoose.Types.ObjectId(workspaceId) 
    });
    if (!project) throw new Error('PROJECT_NOT_FOUND');

    return {
      isWorkspaceMember: !!member,
      isWorkspaceOwner: member?.role === 'owner',
      isProjectOwner: project.owner.toString() === userId,
      workspace
    };
  }

  static async createDiscussion(
    workspaceId: string, 
    projectId: string, 
    userId: string, 
    data: { title: string; content: string }
  ): Promise<SafeDiscussion> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const discussion = new Discussion({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      projectId: new mongoose.Types.ObjectId(projectId),
      author: new mongoose.Types.ObjectId(userId),
      title: data.title,
      content: data.content,
    });

    await discussion.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'discussion_created',
      entityType: 'discussion',
      entityId: discussion._id.toString(),
      metadata: { title: discussion.title }
    });

    await discussion.populate('author', 'name email');
    return this.toSafeDiscussion(discussion);
  }

  static async getDiscussionsByProject(
    workspaceId: string, 
    projectId: string, 
    userId: string,
    limit: number = 50
  ): Promise<SafeDiscussion[]> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const discussions = await Discussion.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name email');

    return discussions.map(d => this.toSafeDiscussion(d));
  }

  static async getDiscussionById(workspaceId: string, projectId: string, discussionId: string, userId: string): Promise<SafeDiscussion> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const discussion = await Discussion.findOne({ 
      _id: new mongoose.Types.ObjectId(discussionId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    }).populate('author', 'name email');

    if (!discussion) {
      throw new Error('DISCUSSION_NOT_FOUND');
    }

    return this.toSafeDiscussion(discussion);
  }

  static async updateDiscussion(
    workspaceId: string, 
    projectId: string, 
    discussionId: string,
    userId: string, 
    data: { title?: string; content?: string }
  ): Promise<SafeDiscussion> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const discussion = await Discussion.findOne({ 
      _id: new mongoose.Types.ObjectId(discussionId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    });

    if (!discussion) {
      throw new Error('DISCUSSION_NOT_FOUND');
    }

    const isDiscussionAuthor = discussion.author.toString() === userId;
    const isOwner = context.isWorkspaceOwner || context.isProjectOwner;

    if (!isDiscussionAuthor && !isOwner) {
      throw new Error('FORBIDDEN');
    }

    const changes: Record<string, unknown> = {};
    if (data.title !== undefined) { discussion.title = data.title; changes.title = true; }
    if (data.content !== undefined) { discussion.content = data.content; }

    await discussion.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'discussion_updated',
      entityType: 'discussion',
      entityId: discussion._id.toString(),
      metadata: changes
    });

    await discussion.populate('author', 'name email');
    return this.toSafeDiscussion(discussion);
  }

  static async deleteDiscussion(workspaceId: string, projectId: string, discussionId: string, userId: string): Promise<void> {
    const context = await this.getContext(workspaceId, projectId, userId);

    // Must be a current workspace member (author/owner checks below still apply).
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const discussion = await Discussion.findOne({
      _id: new mongoose.Types.ObjectId(discussionId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    });

    if (!discussion) {
      throw new Error('DISCUSSION_NOT_FOUND');
    }

    const isDiscussionAuthor = discussion.author.toString() === userId;
    const isOwner = context.isWorkspaceOwner || context.isProjectOwner;

    if (!isDiscussionAuthor && !isOwner) {
      throw new Error('FORBIDDEN');
    }

    await Discussion.deleteOne({ _id: discussion._id });
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'discussion_deleted',
      entityType: 'discussion',
      entityId: discussion._id.toString(),
      metadata: { title: discussion.title }
    });
  }
}
