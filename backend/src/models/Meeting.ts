import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IMeeting extends Document {
  workspaceId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId | IUser;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  attendees: (mongoose.Types.ObjectId | IUser)[];
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema: Schema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
      required: true,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    meetingLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

MeetingSchema.index({ workspaceId: 1, startTime: 1 });
MeetingSchema.index({ workspaceId: 1, status: 1, startTime: 1 });

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
