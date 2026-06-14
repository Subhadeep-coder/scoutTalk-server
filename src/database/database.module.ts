import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
  Server,
  Category,
  Channel,
  ServerMember,
  Invite,
  Message,
  ServerTag,
  ServerEngagementConfig,
  WelcomeMessage,
} from './entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.get<string>('DATABASE_NAME', 'scoutTalk'),
        entities: [
          User,
          RefreshToken,
          PasswordResetToken,
          EmailVerificationToken,
          Server,
          Category,
          Channel,
          ServerMember,
          Invite,
          Message,
          ServerTag,
          ServerEngagementConfig,
          WelcomeMessage,
        ],
        synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
        logging: configService.get<boolean>('DATABASE_LOGGING', false),
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      PasswordResetToken,
      EmailVerificationToken,
      Server,
      Category,
      Channel,
      ServerMember,
      Invite,
      Message,
      ServerTag,
      ServerEngagementConfig,
      WelcomeMessage,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
