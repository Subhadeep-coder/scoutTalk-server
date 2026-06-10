import {
  WebSocketGateway as WsGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';

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

  constructor(
    private jwtService: JwtService,
    private websocketService: WebsocketService,
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
      (socket as any).userId = userId;
      socket.join(`user:${userId}`);
    } catch {
      socket.emit('error', { message: 'Invalid token' });
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = (socket as any).userId;
  }

  async joinServer(socket: Socket, serverId: string) {
    const userId = (socket as any).userId;
    if (!userId) return;
    socket.join(`server:${serverId}`);
  }

  async leaveServer(socket: Socket, serverId: string) {
    socket.leave(`server:${serverId}`);
  }
}
