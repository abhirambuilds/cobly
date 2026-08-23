import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IDiscussion extends Document {
  workspaceId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId | IUser;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscussionSchema: Schema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

DiscussionSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.model<IDiscussion>('Discussion', DiscussionSchema);
