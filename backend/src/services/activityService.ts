import mongoose from 'mongoose';
import Activity, { IActivity } from '../models/Activity';
import Workspace from '../models/Workspace';
import { IUser } from '../models/User';

export interface SafeActivity {
  id: string;
  workspaceId: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: Date;
}

export class ActivityService {
  /**
   * Safely logs an activity without disrupting primary operations.
   */
  static async recordActivity(params: {
    workspaceId: string;
    actorId: string;
    action: string;
    entityType: 'workspace' | 'project' | 'task' | 'member' | 'discussion' | 'comment' | 'meeting';
    entityId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const activity = new Activity({
        workspaceId: new mongoose.Types.ObjectId(params.workspaceId),
        actorId: new mongoose.Types.ObjectId(params.actorId),
        action: params.action,
        entityType: params.entityType,
        entityId: new mongoose.Types.ObjectId(params.entityId),
        metadata: params.metadata,
      });
      await activity.save();
    } catch (error) {
      console.error('Failed to log activity:', error);
      // We intentionally do not throw to prevent breaking the primary mutation.
    }
  }

  static toSafeActivity(activity: IActivity): SafeActivity {
    const actor = activity.actorId as unknown as IUser;
    return {
      id: activity._id.toString(),
      workspaceId: activity.workspaceId.toString(),
      actor: {
        id: actor._id.toString(),
        name: actor.name,
        email: actor.email,
      },
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId.toString(),
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    };
  }

  static async getWorkspaceActivity(workspaceId: string, userId: string): Promise<SafeActivity[]> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');

    const isMember = workspace.members.some(m => m.user.toString() === userId);
    if (!isMember) throw new Error('FORBIDDEN');

    // Limit to recent 100 for basic safety
    const activities = await Activity.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actorId', 'name email');

    return activities.map(a => this.toSafeActivity(a));
  }
}
