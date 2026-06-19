import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmojisController } from './emojis.controller';
import { EmojisService } from './emojis.service';
import { CustomEmoji } from '../database/entities/custom-emoji.entity';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomEmoji, Server, ServerMember]),
    RolesModule,
  ],
  controllers: [EmojisController],
  providers: [EmojisService],
  exports: [EmojisService],
})
export class EmojisModule {}
