import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelPermissionsController } from './channel-permissions.controller';
import { ChannelPermissionsService } from './channel-permissions.service';
import { ChannelOverride } from '../database/entities/channel-override.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerRole } from '../database/entities/server-role.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { MemberRole as MemberRoleEntity } from '../database/entities/member-role.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelOverride,
      Channel,
      ServerRole,
      ServerMember,
      MemberRoleEntity,
    ]),
  ],
  controllers: [ChannelPermissionsController],
  providers: [ChannelPermissionsService],
  exports: [ChannelPermissionsService],
})
export class ChannelPermissionsModule {}
