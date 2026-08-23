import mongoose from 'mongoose';
import Task, { ITask } from '../models/Task';
import Project from '../models/Project';
import Workspace from '../models/Workspace';
import { IUser } from '../models/User';
import { ActivityService } from './activityService';

export interface SafeTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  status: string;
  priority: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskService {
  /**
   * Converts a Mongoose ITask document into a safe API representation.
   */
  static toSafeTask(task: ITask): SafeTask {
    let safeAssignee = null;
    
    if (task.assignee) {
      if (typeof task.assignee === 'object' && '_id' in task.assignee) {
        // Populated user
        const user = task.assignee as unknown as IUser;
        safeAssignee = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      } else {
        // Just ObjectId (should be populated ideally, but handle it safely)
        safeAssignee = {
          id: (task.assignee as mongoose.Types.ObjectId).toString(),
          name: 'Unknown',
          email: 'Unknown'
        };
      }
    }

    return {
      id: task._id.toString(),
      projectId: task.projectId.toString(),
      title: task.title,
      description: task.description,
      assignee: safeAssignee,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Helper to verify Workspace membership and Project scoping.
   * Returns { isWorkspaceMember, isWorkspaceOwner, isProjectOwner }
   */
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

  static async createTask(
    workspaceId: string, 
    projectId: string, 
    userId: string, 
    data: { title: string; description?: string; assignee?: string | null; status?: 'todo' | 'in_progress' | 'completed'; priority?: 'low' | 'medium' | 'high'; dueDate?: Date }
  ): Promise<SafeTask> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    let assigneeId: mongoose.Types.ObjectId | undefined;

    if (data.assignee) {
      const isAssigneeInWorkspace = context.workspace.members.some(m => m.user.toString() === data.assignee);
      if (!isAssigneeInWorkspace) {
        throw new Error('INVALID_ASSIGNEE');
      }
      assigneeId = new mongoose.Types.ObjectId(data.assignee);
    }

    const task = new Task({
      projectId: new mongoose.Types.ObjectId(projectId),
      title: data.title,
      description: data.description,
      assignee: assigneeId,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
    });

    await task.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'task_created',
      entityType: 'task',
      entityId: task._id.toString(),
      metadata: { title: task.title }
    });

    if (assigneeId && assigneeId.toString() !== userId) {
      const { NotificationService } = await import('./notificationService.js');
      await NotificationService.sendNotification({
        recipientId: assigneeId.toString(),
        workspaceId,
        type: 'task_assigned',
        title: 'Assigned to a task',
        message: `You were assigned to task: ${task.title}`,
        entityType: 'task',
        entityId: task._id.toString()
      });
    }

    // Populate for safe return
    await task.populate('assignee', 'name email');
    return this.toSafeTask(task);
  }

  static async getTasksByProject(
    workspaceId: string, 
    projectId: string, 
    userId: string,
    filters?: { status?: string; priority?: string; assignee?: string }
  ): Promise<SafeTask[]> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const query: Record<string, unknown> = { projectId: new mongoose.Types.ObjectId(projectId) };
    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;
    if (filters?.assignee) {
      if (filters.assignee === 'null') {
        query.assignee = null;
      } else {
        query.assignee = new mongoose.Types.ObjectId(filters.assignee);
      }
    }

    const tasks = await Task.find(query).populate('assignee', 'name email');
    return tasks.map(t => this.toSafeTask(t));
  }

  static async getTaskById(workspaceId: string, projectId: string, taskId: string, userId: string): Promise<SafeTask> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const task = await Task.findOne({ 
      _id: new mongoose.Types.ObjectId(taskId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    }).populate('assignee', 'name email');

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    return this.toSafeTask(task);
  }

  static async updateTask(
    workspaceId: string, 
    projectId: string, 
    taskId: string,
    userId: string, 
    data: { title?: string; description?: string; assignee?: string | null; status?: 'todo' | 'in_progress' | 'completed'; priority?: 'low' | 'medium' | 'high'; dueDate?: Date }
  ): Promise<SafeTask> {
    const context = await this.getContext(workspaceId, projectId, userId);
    if (!context.isWorkspaceMember) {
      throw new Error('FORBIDDEN');
    }

    const task = await Task.findOne({ 
      _id: new mongoose.Types.ObjectId(taskId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    });

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    const isTaskAssignee = task.assignee?.toString() === userId;
    const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
    const changes: Record<string, unknown> = {};

    // Check permissions
    if (isOwner) {
      // Full update allowed
      if (data.title !== undefined) { task.title = data.title; changes.title = true; }
      if (data.description !== undefined) { task.description = data.description; }
      if (data.priority !== undefined) { task.priority = data.priority; changes.priority = data.priority; }
      if (data.dueDate !== undefined) { task.dueDate = data.dueDate; }
      
      // Assignee logic for owners
      if (data.assignee !== undefined) {
        if (data.assignee === null) {
          task.assignee = undefined;
          changes.unassigned = true;
        } else {
          const isAssigneeInWorkspace = context.workspace.members.some(m => m.user.toString() === data.assignee);
          if (!isAssigneeInWorkspace) {
            throw new Error('INVALID_ASSIGNEE');
          }
          task.assignee = new mongoose.Types.ObjectId(data.assignee);
          changes.assigned_to = data.assignee;
        }
      }
      
      if (data.status !== undefined) { task.status = data.status; changes.status = data.status; }

    } else if (isTaskAssignee) {
      // Partial update allowed
      if (data.title !== undefined || data.description !== undefined || data.priority !== undefined || data.dueDate !== undefined || data.assignee !== undefined) {
         throw new Error('FORBIDDEN_FIELD_UPDATE');
      }
      if (data.status !== undefined) { task.status = data.status; changes.status = data.status; }
    } else {
      throw new Error('FORBIDDEN');
    }

    await task.save();
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'task_updated',
      entityType: 'task',
      entityId: task._id.toString(),
      metadata: changes
    });

    if (changes.assigned_to && changes.assigned_to !== userId) {
      const { NotificationService } = await import('./notificationService.js');
      await NotificationService.sendNotification({
        recipientId: changes.assigned_to as string,
        workspaceId,
        type: 'task_assigned',
        title: 'Assigned to a task',
        message: `You were assigned to task: ${task.title}`,
        entityType: 'task',
        entityId: task._id.toString()
      });
    }

    await task.populate('assignee', 'name email');
    return this.toSafeTask(task);
  }

  static async deleteTask(workspaceId: string, projectId: string, taskId: string, userId: string): Promise<void> {
    const context = await this.getContext(workspaceId, projectId, userId);
    
    // Only Project Owner or Workspace Owner can delete
    if (!context.isWorkspaceOwner && !context.isProjectOwner) {
      throw new Error('FORBIDDEN');
    }

    const task = await Task.findOne({ 
      _id: new mongoose.Types.ObjectId(taskId), 
      projectId: new mongoose.Types.ObjectId(projectId) 
    });

    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    await Task.deleteOne({ _id: task._id });
    
    await ActivityService.recordActivity({
      workspaceId: workspaceId,
      actorId: userId,
      action: 'task_deleted',
      entityType: 'task',
      entityId: task._id.toString(),
      metadata: { title: task.title }
    });
  }
}
