import { Controller, Post, Get, Body, Param, Headers } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/session.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('session')
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.createSession(createSessionDto);
  }

  @Get(':userId')
  getSessions(@Param('userId') userId: string) {
    return this.sessionService.getSessionsByUser(userId);
  }

  @Post('emergency')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user123' },
        sessionId: { type: 'string', example: 'session456' },
      },
      required: ['userid', 'sessionId'],
    },
  })
  markEmergency(@Body() body: { userId: string; sessionId: string }) {
    return this.sessionService.markEmergency(body.userId, body.sessionId);
  }
}
