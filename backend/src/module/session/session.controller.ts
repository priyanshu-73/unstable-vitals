import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/session.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  createSession(
    @Body() createSessionDto: CreateSessionDto,
    @Headers('x-user-email') userEmail: string,
  ) {
    return this.sessionService.createSession(userEmail, createSessionDto);
  }

  @Get(':userEmail')
  getSessions(@Param('userEmail') userEmail: string) {
    return this.sessionService.getSessionsByUser(userEmail);
  }

  @Post('emergency')
  markEmergency(@Body() body: { userEmail: string; sessionId: string }) {
    return this.sessionService.markEmergency(body.userEmail, body.sessionId);
  }
}
