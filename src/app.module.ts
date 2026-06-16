import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { OnboardingGuard } from './auth/guards/onboarding.guard';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { WebsocketModule } from './websocket/websocket.module';
import { appConfig, cloudinaryConfig, googleConfig, jwtConfig } from './config';
import { DatabaseModule } from './database';
import { UsersModule } from './users/users.module';
import { ServersModule } from './servers/servers.module';
import { ChannelsModule } from './channels/channels.module';
import { MembersModule } from './members/members.module';
import { MessagesModule } from './messages/messages.module';
import { ServerSettingsModule } from './server-settings/server-settings.module';
import { RolesModule } from './roles/roles.module';
import { EmojisModule } from './emojis/emojis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cloudinaryConfig, googleConfig, jwtConfig],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CloudinaryModule,
    WebsocketModule,
    ServersModule,
    ChannelsModule,
    MembersModule,
    MessagesModule,
    ServerSettingsModule,
    RolesModule,
    EmojisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: OnboardingGuard,
    },
  ],
})
export class AppModule {}
