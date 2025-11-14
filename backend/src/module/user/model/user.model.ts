export class Session {
  sessionId: string;
  exerciseName: string;
  startTime: string;
  endTime: string;
  emergency: boolean = false;
}

export class User {
  userId: string;
  name: string;
  email: string;
  password: string;
  guardianEmail: string;
  sessions: Session[] = [];
}
