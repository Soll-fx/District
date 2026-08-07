export type Trade = {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: number | null;
  exit: number | null;
  lots: number | null;
  pnl: number;
  rMultiplier: number | null;
  session: "ASIA" | "LONDON" | "NEW_YORK" | null;
  entryDate: string;
  exitDate: string | null;
  notes: string | null;
  link: string | null;
  flagged: boolean;
  accountId: string | null;
  deletedAt: string | null;
  createdAt: string;
  tags?: { id: string; name: string; color: string }[];
  account?: { id: string; name: string } | null;
};

export type TradeListResponse = {
  items: Trade[];
  total: number;
  shown: number;
};

export type AccountStats = {
  trades: number;
  wins: number;
  losses: number;
  longs: number;
  shorts: number;
  winRate: number;
};

export type TradingAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  createdAt: string;
  _count?: { trades: number };
  currentBalance?: number;
  stats?: AccountStats;
};

export type PostMortem = {
  id: string;
  tradeId: string | null;
  asset: string;
  direction: "LONG" | "SHORT";
  pnl: number;
  rMultiplier: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TradeStats = {
  totalPnl: number;
  winRate: number;
  avgR: number;
  count: number;
  wins: number;
  losses: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  maxDrawdown: number;
  sessions: Record<string, { count: number; pnl: number }>;
  byMonth: Record<string, { count: number; pnl: number }>;
  longCount: number;
  shortCount: number;
};

export type EquityPoint = { date: string; balance: number };

export type EquityResponse = {
  points: EquityPoint[];
  count: number;
};

export type AnalyticsSummary = {
  overall: number;
  grade: string;
  axes: { key: string; label: string; value: number }[];
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  maxDrawdown: number;
  count: number;
  longCount: number;
  shortCount: number;
};

export type ProfileMetric = {
  id: string;
  key: string;
  label: string;
  value: string;
  category: "PROP" | "TOURNAMENT" | "TRADING" | "COMMUNITY";
  visible: boolean;
  order: number;
};

export type LeaderboardUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rank: number;
  score: number;
  count: number;
  winRate: number;
  profitFactor: number;
  avgR: number;
  totalPnl: number;
  volume: string;
  streak: number;
  discipline: number;
};

export type LeaderboardResponse = {
  users: LeaderboardUser[];
  total: number;
  me: LeaderboardUser | null;
};

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; name?: string; role?: string; locale?: "ru" | "en" };
};

export type Idea = {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry: string | null;
  tp: string | null;
  sl: string | null;
  thesis: string | null;
  tvLink: string | null;
  status: "WATCH" | "HIT" | "INVALID" | "ARCHIVE";
  convertedTradeId: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type IdeaListResponse = { items: Idea[]; total: number };

export type IdeaStats = {
  total: number;
  watch: number;
  hit: number;
  invalid: number;
  archive: number;
  accuracy: number;
};

export type Tag = { id: string; name: string; color: string };

export type Asset = { id: string; symbol: string; name: string; color: string; category: string };

export type Strategy = { id: string; name: string; description: string | null; meta: string | null; color: string };

export type ChangelogEntry = {
  id: string;
  version: string;
  title: string;
  text: string;
  type: "FEATURE" | "FIX" | "MAJOR" | "SECURITY";
  date: string;
};

export type InboxTicketMessage = {
  id: string;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
  authorId: string;
};

export type InboxTicket = {
  id: string;
  subject: string;
  category: string;
  status: "OPEN" | "WAITING" | "CLOSED";
  updatedAt: string;
  createdAt: string;
  messages: InboxTicketMessage[];
  _count?: { messages: number };
};

export type Profile = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string | null;
  role: string;
  twoFactorEnabled: boolean;
  locale?: string;
  timezone?: string;
  instagram?: string | null;
  telegram?: string | null;
  youtube?: string | null;
  tradingview?: string | null;
  createdAt: string;
};

export type DeviceSession = {
  id: string;
  deviceName: string;
  browser: string | null;
  os: string | null;
  ip: string | null;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
};

export type SendTwoFactorCodeResult = { sent: boolean; devCode?: string };

export type EnableTwoFactorResult = { enabled: boolean; backupCodes?: string[] };

export type LoginResponse = {
  accessToken?: string;
  user?: { id: string; email: string; name?: string; role?: string; locale?: "ru" | "en" };
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  devCode?: string;
};

export type NewsItem = {
  id: string;
  country: string;
  instrument: string;
  impact: "high" | "medium" | "low";
  title: string;
  time?: string | null;
  prev?: string | null;
  forecast?: string | null;
  date: string;
};

export type GeopoliticsPost = {
  id: string;
  emoji: string | null;
  region: string;
  title: string;
  body: string;
  tags: string[];
  source: string;
  impact: string;
  impactKey: string;
  live: boolean;
  createdAt: string;
};

export type Course = {
  id: string;
  title: string;
  tag: string;
  color: string;
  lessons: number;
  done: number;
  time: string;
  locked: boolean;
  order: number;
};

export type PromoCode = {
  id: string;
  code: string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  userCount: number;
};

export type StreamReaction = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type Stream = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "YOUTUBE" | "VIMEO" | "GOOGLE_DRIVE" | "UPLOAD";
  thumbnailUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  createdAt: string;
  reactions: StreamReaction[];
};

export type BrokerAccount = {
  id: string;
  connected: boolean;
  apiProvider: "mock" | "metapi" | null;
  accountId: string | null;
  login: string | null;
  serverName: string | null;
  label: string | null;
  balance: number | null;
  currency: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

