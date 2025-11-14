import { model, Document, Types } from 'mongoose';
import { UserSchema } from '../schema/user.schema';
import { Session } from 'src/module/session/model/session.model';

export interface User extends Document {
  userId: string;
  name: string;
  email: string;
  password: string;
  guardianEmail: string;
  sessions: Types.ObjectId[] | Session[];
}

export const UserModel = model<User>('User', UserSchema);
