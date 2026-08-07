import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TradesModule } from './trades/trades.module';
import { AccountsModule } from './accounts/accounts.module';
import { PostMortemsModule } from './postmortems/postmortems.module';
import { IdeasModule } from './ideas/ideas.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LibrariesModule } from './libraries/libraries.module';
import { RewardsModule } from './rewards/rewards.module';
import { InboxModule } from './inbox/inbox.module';
import { ChangelogModule } from './changelog/changelog.module';
import { SettingsModule } from './settings/settings.module';
import { TrashModule } from './trash/trash.module';
import { FeedModule } from './feed/feed.module';
import { NewsModule } from './news/news.module';
import { GeopoliticsModule } from './geopolitics/geopolitics.module';
import { EducationModule } from './education/education.module';
import { PromosModule } from './promos/promos.module';
import { StreamsModule } from './streams/streams.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { BrokerModule } from './broker/broker.module';
import { TelegramModule } from './common/telegram/telegram.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TradesModule,
    AccountsModule,
    PostMortemsModule,
    IdeasModule,
    AnalyticsModule,
    LibrariesModule,
    RewardsModule,
    InboxModule,
    ChangelogModule,
    SettingsModule,
    TrashModule,
    FeedModule,
    NewsModule,
    GeopoliticsModule,
    EducationModule,
    PromosModule,
    StreamsModule,
    TournamentsModule,
    BrokerModule,
    TelegramModule,
    NotificationsModule,
  ],
})
export class AppModule {}
