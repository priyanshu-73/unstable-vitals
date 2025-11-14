import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    email: { type: String, index: true, sparse: true },
    name: { type: String, sparse: true },
    password: { type: String },
    guardianEmail: { type: String, sparse: true },
    sessions: [{ type: Schema.Types.ObjectId, ref: 'Session', default: [] }],
  },
  { timestamps: true },
);
