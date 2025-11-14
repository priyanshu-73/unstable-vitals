import { Module, forwardRef } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
