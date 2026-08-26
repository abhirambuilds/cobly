import mongoose from 'mongoose';
import Workspace, { IWorkspace } from '../models/Workspace';
import User, { IUser } from '../models/User';
import { ActivityService } from './activityService';

export interface SafeWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  membersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceService {
  /**
   * Converts a Mongoose IWorkspace document into a safe API representation,
   * completely hiding the internal members array and mapping _id to id.
   */
  static toSafeWorkspace(workspace: IWorkspace): SafeWorkspace {
    return {
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.owner.toString(),
      membersCount: workspace.members.length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  static async createWorkspace(userId: string, data: { name: string; description?: string }): Promise<SafeWorkspace> {
    const workspace = new Workspace({
      name: data.name,
      description: data.description,
      owner: new mongoose.Types.ObjectId(userId),
      members: [{ user: new mongoose.Types.ObjectId(userId), role: 'owner' }],
    });

    await workspace.save();
    
    // Log activity
    await ActivityService.recordActivity({
      workspaceId: workspace._id.toString(),
      actorId: userId,
      action: 'workspace_created',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
      metadata: { name: workspace.name }
    });

    return this.toSafeWorkspace(workspace);
  }

  static async getWorkspacesForUser(userId: string): Promise<SafeWorkspace[]> {
    const workspaces = await Workspace.find({ 'members.user': new mongoose.Types.ObjectId(userId) });
    return workspaces.map(w => this.toSafeWorkspace(w));
  }

  /**
   * Gets a specific workspace by ID, ensuring the user is a member.
   */
  static async getWorkspaceById(workspaceId: string, userId: string): Promise<SafeWorkspace> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('NOT_FOUND');
    }

    const isMember = workspace.members.some(m => m.user.toString() === userId);
    if (!isMember) {
      throw new Error('FORBIDDEN');
    }

    return this.toSafeWorkspace(workspace);
  }

  /**
   * Updates a workspace, ensuring the user is the owner.
   */
  static async updateWorkspace(workspaceId: string, userId: string, data: { name?: string; description?: string }): Promise<SafeWorkspace> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('NOT_FOUND');
    }

    const member = workspace.members.find(m => m.user.toString() === userId);
    if (!member || member.role !== 'owner') {
      throw new Error('FORBIDDEN');
    }

    if (data.name !== undefined) workspace.name = data.name;
    if (data.description !== undefined) workspace.description = data.description;

    await workspace.save();

    // Log activity
    await ActivityService.recordActivity({
      workspaceId: workspace._id.toString(),
      actorId: userId,
      action: 'workspace_updated',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
    });

    return this.toSafeWorkspace(workspace);
  }

  /**
   * Deletes a workspace, ensuring the user is the owner.
   */
  static async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('NOT_FOUND');
    }

    const member = workspace.members.find(m => m.user.toString() === userId);
    if (!member || member.role !== 'owner') {
      throw new Error('FORBIDDEN');
    }

    await Workspace.deleteOne({ _id: workspace._id });
  }

  // --- MEMBERSHIP MANAGEMENT ---

  static async getMembers(workspaceId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email');
    if (!workspace) throw new Error('NOT_FOUND');

    const isMember = workspace.members.some(m => m.user._id.toString() === userId);
    if (!isMember) throw new Error('FORBIDDEN');

    return workspace.members.map(m => {
      const u = m.user as unknown as IUser;
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: m.role
      };
    });
  }

  static async addMemberByEmail(workspaceId: string, requesterId: string, email: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('NOT_FOUND');

    const requester = workspace.members.find(m => m.user.toString() === requesterId);
    if (!requester || requester.role !== 'owner') throw new Error('FORBIDDEN');

    // target user must exist by email
    const target = await User.findOne({ email: email.toLowerCase().trim() });
    if (!target) throw new Error('USER_NOT_FOUND');
    const targetUserId = target._id.toString();

    const alreadyMember = workspace.members.some(m => m.user.toString() === targetUserId);
    if (alreadyMember) throw new Error('ALREADY_MEMBER');

    workspace.members.push({ user: target._id as any, role: 'member' });
    await workspace.save();

    await ActivityService.recordActivity({
      workspaceId: workspace._id.toString(),
      actorId: requesterId,
      action: 'member_added',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { name: target.name }
    });

    if (requesterId !== targetUserId) {
      const { NotificationService } = await import('./notificationService.js');
      await NotificationService.sendNotification({
        recipientId: targetUserId,
        workspaceId: workspace._id.toString(),
        type: 'workspace_member_added',
        title: 'Added to workspace',
        message: `You were added to workspace: ${workspace.name}`,
      });
    }
  }

  static async removeMember(workspaceId: string, requesterId: string, targetUserId: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('NOT_FOUND');

    const requester = workspace.members.find(m => m.user.toString() === requesterId);
    if (!requester || requester.role !== 'owner') throw new Error('FORBIDDEN');

    const targetIndex = workspace.members.findIndex(m => m.user.toString() === targetUserId);
    if (targetIndex === -1) throw new Error('MEMBER_NOT_FOUND');

    if (workspace.members[targetIndex].role === 'owner') {
      throw new Error('CANNOT_REMOVE_OWNER');
    }

    workspace.members.splice(targetIndex, 1);
    await workspace.save();

    await ActivityService.recordActivity({
      workspaceId: workspace._id.toString(),
      actorId: requesterId,
      action: 'member_removed',
      entityType: 'member',
      entityId: targetUserId
    });
  }
}
