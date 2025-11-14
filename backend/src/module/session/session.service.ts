import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateSessionDto } from './dto/session.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(private readonly userService: UserService) {}

  createSession(userEmail: string, dto: CreateSessionDto) {
    const session = {
      ...dto,
      sessionId: uuidv4(), // always generate new UUID here
      emergency: dto.emergency || false,
    };
    return this.userService.addSession(userEmail, session);
  }

  getSessionsByUser(email: string) {
    const user = this.userService.findByEmail(email);
    return user ? user.sessions : [];
  }

  markEmergency(userEmail: string, sessionId: string) {
    const user = this.userService.findByEmail(userEmail);
    if (!user) return { message: 'User not found' };
    const session = user.sessions.find((s) => s.sessionId === sessionId);
    if (!session) return { message: 'Session not found' };
    session.emergency = true;
    return session;
  }
}
