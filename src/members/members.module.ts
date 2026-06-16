import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { Invite } from '../database/entities/invite.entity';
import { ServerEngagementConfig } from '../database/entities/server-engagement-config.entity';
import { WelcomeMessage } from '../database/entities/welcome-message.entity';
import { Message } from '../database/entities/message.entity';
import { Channel } from '../database/entities/channel.entity';
import { User } from '../database/entities/user.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      ServerMember,
      Invite,
      ServerEngagementConfig,
      WelcomeMessage,
      Message,
      Channel,
      User,
    ]),
    RolesModule,
  ],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
