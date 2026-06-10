import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToServer(serverId: string, event: string, data: unknown) {
    this.server?.to(`server:${serverId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event: string, data: unknown) {
    this.server?.emit(event, data);
  }
}
