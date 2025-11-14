import { model, Document } from 'mongoose';
import { SessionSchema } from 'src/module/session/schema/session.schema';

export interface Session extends Document {
  userId: string;
  exerciseName: string;
  startTime: Date;
  endTime: Date;
  emergency: boolean;
}

export const SessionModel = model<Session>('Session', SessionSchema);
