import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | IUser;
  workspaceId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    type: {
      type: String,
      enum: ['workspace_member_added', 'task_assigned', 'meeting_created', 'meeting_updated', 'meeting_cancelled'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize for querying a user's notifications, unread filter, and sorting
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
