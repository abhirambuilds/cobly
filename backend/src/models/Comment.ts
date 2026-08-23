import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IComment extends Document {
  workspaceId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  discussionId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId | IUser;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
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
    discussionId: {
      type: Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

CommentSchema.index({ discussionId: 1, createdAt: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
