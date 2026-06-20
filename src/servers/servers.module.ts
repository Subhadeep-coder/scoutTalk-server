import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { Server } from '../database/entities/server.entity';
import { Category } from '../database/entities/category.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { MemberRole } from '../database/entities/member-role.entity';
import { ChannelOverride } from '../database/entities/channel-override.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Server,
      Category,
      Channel,
      ServerMember,
      MemberRole,
      ChannelOverride,
    ]),
    RolesModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
