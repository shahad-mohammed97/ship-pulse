import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
  namespace: 'tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Cleanup userSockets map
    for (const [userId, sockets] of this.userSockets.entries()) {
      const filtered = sockets.filter((id) => id !== client.id);
      if (filtered.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, filtered);
      }
    }
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(client: Socket, userId: string) {
    this.logger.log(`User ${userId} joined tracking room via socket ${client.id}`);
    const existing = this.userSockets.get(userId) || [];
    this.userSockets.set(userId, [...existing, client.id]);
    client.join(`user_${userId}`);
  }

  notifyStatusUpdate(userId: string, data: any) {
    this.logger.log(`Notifying user ${userId} about update for order ${data.orderId}`);
    this.server.to(`user_${userId}`).emit('statusUpdate', data);
  }
}
