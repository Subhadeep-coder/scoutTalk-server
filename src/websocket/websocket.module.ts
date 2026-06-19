import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { ServerMember } from '../database/entities/server-member.entity';
import { User } from '../database/entities/user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ServerMember, User])],
  providers: [WebsocketGateway, WebsocketService],
  exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule {}
