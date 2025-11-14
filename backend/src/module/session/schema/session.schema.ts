import { Schema } from 'mongoose';

export const SessionSchema = new Schema(
  {
    userId: { type: String, required: true, ref: 'User' },
    exerciseName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    emergency: { type: Boolean, default: false },
  },
  { timestamps: true },
);
