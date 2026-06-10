import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from '../database/entities/message.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Channel, ServerMember])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
