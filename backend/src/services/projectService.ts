import mongoose from 'mongoose';
import Project, { IProject } from '../models/Project';
import Workspace from '../models/Workspace';

export interface SafeProject {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  description?: string;
  status: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectService {
  /**
   * Converts a Mongoose IProject document into a safe API representation.
   */
  static toSafeProject(project: IProject): SafeProject {
    return {
      id: project._id.toString(),
      workspaceId: project.workspaceId.toString(),
      ownerId: project.owner.toString(),
      name: project.name,
      description: project.description,
      status: project.status,
      deadline: project.deadline,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Helper to verify if a user has access to a workspace.
   * Returns { isMember, isWorkspaceOwner }
   */
  private static async checkWorkspaceAccess(workspaceId: string, userId: string) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error('WORKSPACE_NOT_FOUND');
    }

    const member = workspace.members.find(m => m.user.toString() === userId);
    return {
      isMember: !!member,
      isWorkspaceOwner: member?.role === 'owner',
    };
  }

  static async createProject(
    workspaceId: string, 
    userId: string, 
    data: { name: string; description?: string; status?: 'planned' | 'active' | 'completed' | 'archived'; deadline?: Date }
  ): Promise<SafeProject> {
    const access = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!access.isMember) {
      throw new Error('FORBIDDEN');
    }

    const project = new Project({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      owner: new mongoose.Types.ObjectId(userId),
      name: data.name,
      description: data.description,
      status: data.status || 'planned',
      deadline: data.deadline,
    });

    await project.save();
    return this.toSafeProject(project);
  }

  static async getProjectsByWorkspace(workspaceId: string, userId: string): Promise<SafeProject[]> {
    const access = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!access.isMember) {
      throw new Error('FORBIDDEN');
    }

    const projects = await Project.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) });
    return projects.map(p => this.toSafeProject(p));
  }

  static async getProjectById(workspaceId: string, projectId: string, userId: string): Promise<SafeProject> {
    const access = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!access.isMember) {
      throw new Error('FORBIDDEN');
    }

    const project = await Project.findOne({ 
      _id: new mongoose.Types.ObjectId(projectId), 
      workspaceId: new mongoose.Types.ObjectId(workspaceId) 
    });

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    return this.toSafeProject(project);
  }

  static async updateProject(
    workspaceId: string, 
    projectId: string, 
    userId: string, 
    data: { name?: string; description?: string; status?: 'planned' | 'active' | 'completed' | 'archived'; deadline?: Date }
  ): Promise<SafeProject> {
    const access = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!access.isMember) {
      throw new Error('FORBIDDEN');
    }

    const project = await Project.findOne({ 
      _id: new mongoose.Types.ObjectId(projectId), 
      workspaceId: new mongoose.Types.ObjectId(workspaceId) 
    });

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const isProjectOwner = project.owner.toString() === userId;
    if (!isProjectOwner && !access.isWorkspaceOwner) {
      throw new Error('FORBIDDEN');
    }

    if (data.name !== undefined) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.status !== undefined) project.status = data.status;
    if (data.deadline !== undefined) project.deadline = data.deadline;

    await project.save();
    return this.toSafeProject(project);
  }

  static async deleteProject(workspaceId: string, projectId: string, userId: string): Promise<void> {
    const access = await this.checkWorkspaceAccess(workspaceId, userId);
    if (!access.isMember) {
      throw new Error('FORBIDDEN');
    }

    const project = await Project.findOne({ 
      _id: new mongoose.Types.ObjectId(projectId), 
      workspaceId: new mongoose.Types.ObjectId(workspaceId) 
    });

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    const isProjectOwner = project.owner.toString() === userId;
    if (!isProjectOwner && !access.isWorkspaceOwner) {
      throw new Error('FORBIDDEN');
    }

    await Project.deleteOne({ _id: project._id });
  }
}
