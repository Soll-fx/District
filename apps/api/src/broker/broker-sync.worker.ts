import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { BrokerService } from './broker.service';

const SYNC_INTERVAL_MS = 30_000;

/**
 * Каждые 30 сек тянет историю сделок по активным матчам RUNNING-турниров,
 * чтобы счёт дуэли обновлялся «на лету».
 */
@Injectable()
export class BrokerSyncWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly broker: BrokerService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.broker.syncTournamentMatches().catch(() => undefined);
    }, SYNC_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
