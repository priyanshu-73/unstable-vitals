import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateSessionDto } from './dto/session.dto';
import { EmailService } from './email.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async createSession(dto: CreateSessionDto) {
    if (!dto.userId) return null;
    const newSession = await this.userService.addSession(dto);
    return newSession;
  }

  async getSessionsByUser(userId: string) {
    const user = await this.userService.findById(userId);
    return user?.sessions ?? [];
  }

  async markEmergency(userId: string, sessionId: string) {
    const user = await this.userService.findById(userId);
    if (!user) return { message: 'User not found' };

    if (
      !user.sessions ||
      !user.sessions.length ||
      typeof user.sessions[0] === 'string'
    ) {
      await user.populate('sessions');
    }

    const session = user.sessions.find(
      (s) => String(s._id) === String(sessionId),
    );

    if (!session) return { message: 'Session not found' };

    (session as any).emergency = true;

    if (typeof (session as any).save === 'function') {
      await (session as any).save();
      await this.emailService.sendEmail(user.guardianEmail);
    }

    return session;
  }
}
