import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { Invite } from '../database/entities/invite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Server, ServerMember, Invite])],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
