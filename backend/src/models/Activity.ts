import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IActivity extends Document {
  workspaceId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId | IUser;
  action: string;
  entityType: 'workspace' | 'project' | 'task' | 'member' | 'discussion' | 'comment' | 'meeting';
  entityId: mongoose.Types.ObjectId;
  metadata?: any;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['workspace', 'project', 'task', 'member', 'discussion', 'comment', 'meeting'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Activities are immutable
  }
);

// Compound index for efficient querying of workspace activity ordered by time
ActivitySchema.index({ workspaceId: 1, createdAt: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
