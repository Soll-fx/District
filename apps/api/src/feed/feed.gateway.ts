import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FEED_SAMPLES = [
  {
    user: 'Alex Fox',
    initials: 'AF',
    color: '#7C6CF0',
    action: 'закрыл сделку +3.4R на XAUUSD',
  },
  {
    user: 'Mia Kovač',
    initials: 'MK',
    color: '#14B8A6',
    action: 'закрыла день в плюс +4.2R',
  },
  {
    user: 'Liam Park',
    initials: 'LP',
    color: '#F59E0B',
    action: 'оформил серию из 7 выигрышных сделок',
  },
  {
    user: 'Sofia Reyes',
    initials: 'SR',
    color: '#EF4444',
    action: 'выполнила 100 сделок подряд с дисциплиной',
  },
  {
    user: 'Noah Kim',
    initials: 'NK',
    color: '#2563EB',
    action: 'получил реакцию 👻 на сделку EURUSD',
  },
  {
    user: 'Emma Wolf',
    initials: 'EW',
    color: '#EC4899',
    action: 'сделала идеальный заход на XAUUSD',
  },
];

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  },
})
export class FeedGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(FeedGateway.name);
  private timer: NodeJS.Timeout | null = null;
  private cursor = 0;

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(socket: Socket) {
    this.logger.log(`feed connected: ${socket.id}`);

    const initial = await this.prisma.achievement.findMany({
      include: {
        reactions: true,
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { awardedAt: 'desc' },
      take: 10,
    });

    socket.emit('feed.init', {
      items: initial.map((a) => ({
        id: a.id,
        user: a.user.name,
        action: a.title,
        time: a.awardedAt,
        reactions: this.groupReactions(a.reactions),
      })),
    });

    if (!this.timer) {
      this.timer = setInterval(() => {
        const item = FEED_SAMPLES[this.cursor % FEED_SAMPLES.length];
        this.cursor += 1;
        this.server.emit('feed.event', {
          id: `live-${Date.now()}`,
          user: item.user,
          initials: item.initials,
          color: item.color,
          action: item.action,
          time: 'только что',
          reactions: [],
          live: true,
        });
      }, 12000);
    }
  }

  @SubscribeMessage('feed.react')
  onReact(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { itemId: string; emoji: string },
  ) {
    this.server.emit('feed.reacted', {
      itemId: payload.itemId,
      emoji: payload.emoji,
      by: socket.id,
    });
  }

  private groupReactions(
    reactions: { emoji: string }[],
  ): { emoji: string; count: number }[] {
    const map = new Map<string, number>();
    for (const r of reactions) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
    }
    return [...map.entries()].map(([emoji, count]) => ({ emoji, count }));
  }
}
