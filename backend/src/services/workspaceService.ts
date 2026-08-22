import mongoose from 'mongoose';
import Workspace, { IWorkspace } from '../models/Workspace';

export interface SafeWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceService {
  /**
   * Converts a Mongoose IWorkspace document into a safe API representation.
   */
  static toSafeWorkspace(workspace: IWorkspace): SafeWorkspace {
    return {
      id: workspace._id.toString(),
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.owner.toString(),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  /**
   * Creates a new workspace with the creator as the owner.
   */
  static async createWorkspace(userId: string, data: { name: string; description?: string }): Promise<SafeWorkspace> {
    const workspace = new Workspace({
      name: data.name,
      description: data.description,
      owner: new mongoose.Types.ObjectId(userId),
      members: [
        {
          user: new mongoose.Types.ObjectId(userId),
          role: 'owner',
        }
      ]
    });

    await workspace.save();
    return this.toSafeWorkspace(workspace);
  }

  /**
   * Lists all workspaces where the user is a member or owner.
   */
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
}
