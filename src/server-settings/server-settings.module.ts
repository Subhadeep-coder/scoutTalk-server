import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerSettingsController } from './server-settings.controller';
import { ServerSettingsService } from './server-settings.service';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { ServerTag } from '../database/entities/server-tag.entity';
import { ServerEngagementConfig } from '../database/entities/server-engagement-config.entity';
import { WelcomeMessage } from '../database/entities/welcome-message.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerMember,
      ServerTag,
      ServerEngagementConfig,
      WelcomeMessage,
    ]),
    RolesModule,
  ],
  controllers: [ServerSettingsController],
  providers: [ServerSettingsService],
  exports: [ServerSettingsService],
})
export class ServerSettingsModule {}
