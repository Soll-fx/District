import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { sha256hex } from '../common/device';

const ROOM_PREFIX = 'user:';

@WebSocketGateway({
  namespace: '/inbox',
  cors: {
    origin:
      process.env.CORS_ORIGIN?.split(',') ?? [
        'http://localhost:3000',
        'https://district-wccn-beta.vercel.app',
      ],
  },
})
export class InboxGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(InboxGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.query?.token as string | undefined);
      if (!token) throw new Error('no token');

      const payload = (await this.jwt.verifyAsync(token)) as {
        sub?: string;
        sid?: string;
      };
      if (!payload.sid) throw new Error('no session');

      const tokenHash = sha256hex(payload.sid);
      const session = await this.prisma.session.findUnique({
        where: { tokenHash },
      });
      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new Error('bad session');
      }

      await socket.join(`${ROOM_PREFIX}${session.userId}`);
      this.logger.log(`inbox connected: ${socket.id} (user ${session.userId})`);
    } catch (err) {
      this.logger.warn(`inbox connect rejected: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  pushToUser(userId: string) {
    this.server.to(`${ROOM_PREFIX}${userId}`).emit('inbox.updated', {
      at: Date.now(),
    });
  }
}
