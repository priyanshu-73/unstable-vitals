import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './module/user/user.module';
import { SessionModule } from './module/session/session.module';

@Module({
  imports: [
    // MongooseModule.forRoot('mongodb://localhost:27017/unstable-vitals-db'),
    UserModule,
    SessionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
