import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: 'owner' | 'member';
}

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member',
    required: true,
  }
}, { _id: false });

const WorkspaceSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [WorkspaceMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
