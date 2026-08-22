import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  workspaceId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'archived'],
      default: 'planned',
      required: true,
    },
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
