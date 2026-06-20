import {
  WebSocketGateway as WsGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WebsocketService } from './websocket.service';
import { ServerMember } from '../database/entities/server-member.entity';
import { User } from '../database/entities/user.entity';

@Injectable()
@WsGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeConnections = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private websocketService: WebsocketService,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  afterInit() {
    this.websocketService.setServer(this.server);
  }

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.query?.token as string);

      if (!token) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token);
      const userId = payload.sub;

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username', 'displayName', 'avatar'],
      });
      if (!user) {
        socket.disconnect();
        return;
      }

      (socket as any).userId = userId;
      (socket as any).user = user;
      socket.join(`user:${userId}`);

      const connections = this.activeConnections.get(userId);
      const isFirst = !connections || connections.size === 0;

      if (!connections) {
        this.activeConnections.set(userId, new Set());
      }
      this.activeConnections.get(userId)!.add(socket.id);

      if (isFirst) {
        const serverIds = (
          await this.memberRepository.find({
            where: { userId },
            select: ['serverId'],
          })
        ).map((m) => m.serverId);

        (socket as any).serverIds = serverIds;

        for (const serverId of serverIds) {
          this.server
            .to(`server:${serverId}`)
            .emit('presence:online', { user });
        }
      }
    } catch {
      socket.emit('error', { message: 'Invalid token' });
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = (socket as any).userId as string | undefined;
    if (!userId) return;

    const connections = this.activeConnections.get(userId);
    if (!connections) return;

    connections.delete(socket.id);

    if (connections.size === 0) {
      this.activeConnections.delete(userId);

      const serverIds = (socket as any).serverIds as string[] | undefined;
      const user = (socket as any).user;
      if (serverIds && serverIds.length > 0 && user) {
        for (const serverId of serverIds) {
          this.server
            .to(`server:${serverId}`)
            .emit('presence:offline', { user });
        }
      }
    }
  }

  private async isServerMember(
    userId: string,
    serverId: string,
  ): Promise<boolean> {
    const count = await this.memberRepository.count({
      where: { userId, serverId },
    });
    return count > 0;
  }

  @SubscribeMessage('joinServer')
  async joinServer(client: Socket, serverId: string) {
    const userId = (client as any).userId;
    if (!userId) return;

    const isMember = await this.isServerMember(userId, serverId);
    if (!isMember) {
      client.emit('error', { message: 'You are not a member of this server' });
      return;
    }

    client.join(`server:${serverId}`);

    const serverIds = (client as any).serverIds as string[] | undefined;
    if (!serverIds?.includes(serverId)) {
      (client as any).serverIds = [...(serverIds ?? []), serverId];
    }
  }

  @SubscribeMessage('leaveServer')
  async leaveServer(client: Socket, serverId: string) {
    client.leave(`server:${serverId}`);
  }

  @SubscribeMessage('typing:start')
  async typingStart(
    client: Socket,
    payload: { channelId: string; serverId: string },
  ) {
    const user = (client as any).user as
      | { id: string; username?: string; displayName?: string; avatar?: string }
      | undefined;
    const userId = (client as any).userId as string | undefined;
    if (!user || !userId) return;

    const isMember = await this.isServerMember(userId, payload.serverId);
    if (!isMember) return;

    this.server.to(`server:${payload.serverId}`).emit('channel:typing', {
      userId: user.id,
      channelId: payload.channelId,
      user,
    });
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    client: Socket,
    payload: { channelId: string; serverId: string },
  ) {
    const user = (client as any).user as { id: string } | undefined;
    const userId = (client as any).userId as string | undefined;
    if (!user || !userId) return;

    const isMember = await this.isServerMember(userId, payload.serverId);
    if (!isMember) return;

    this.server.to(`server:${payload.serverId}`).emit('channel:typing:stop', {
      userId: user.id,
      channelId: payload.channelId,
    });
  }
}
