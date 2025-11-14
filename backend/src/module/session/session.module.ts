import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionSchema } from './schema/session.schema';
import { SessionService } from './session.service';
import { UserModule } from '../user/user.module';
import { SessionController } from './session.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Session', schema: SessionSchema }]),
    UserModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, EmailService],
  exports: [SessionService],
})
export class SessionModule {}
