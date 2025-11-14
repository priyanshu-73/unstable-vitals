import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { SessionModule } from './module/session/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error(
            'MongoDB URI is not defined in environment variables',
          );
        }
        return {
          uri,
        };
      },
    }),
    UserModule,
    SessionModule,
  ],
  exports: [MongooseModule],
})
export class AppModule {}