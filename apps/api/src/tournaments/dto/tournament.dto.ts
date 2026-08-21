import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentMatchStatus } from '@prisma/client';

export class RulesSnapshotDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  weightProfit?: number;

  @ApiPropertyOptional({ example: 1.5, default: 1.5 })
  @IsOptional()
  @IsNumber()
  weightDrawdown?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  penaltyPerViolation?: number;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @IsNumber()
  maxSingleLoss?: number;
}

export class CreateTournamentDto {
  @ApiProperty({ example: 'Летний турнир Sollo Cup' })
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiPropertyOptional({
    example: 'Брэкеты на 16 участников, скоринг по return %',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({ example: '2026-08-10T18:00:00Z' })
  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional({ example: '2026-08-24T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 8, default: 8 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(64)
  minPlayers?: number;

  @ApiPropertyOptional({ example: 16, default: 16 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(64)
  maxPlayers?: number;

  @ApiPropertyOptional({ example: '$1000' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  prizePool?: string;

  @ApiPropertyOptional({ type: RulesSnapshotDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RulesSnapshotDto)
  rules?: RulesSnapshotDto;

  @ApiPropertyOptional({
    description:
      'Счёт матчей считается только по брокерским сделкам (MT4/MT5). Участие требует подключённый счёт.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requireBroker?: boolean;
}

export enum TournamentSeeding {
  JOIN = 'join',
  RANDOM = 'random',
  RATING = 'rating',
}

export class StartTournamentDto {
  @ApiPropertyOptional({
    enum: TournamentSeeding,
    default: TournamentSeeding.RANDOM,
  })
  @IsOptional()
  @IsEnum(TournamentSeeding)
  seeding?: TournamentSeeding;

  @ApiPropertyOptional({
    example: 24,
    description: 'Длительность раунда в часах (окно дуэли)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24 * 30)
  roundHours?: number;
}

export class UpdateMatchDto {
  @ApiPropertyOptional({ example: '2026-08-10T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-08-11T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=abc' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  streamUrl?: string;

  @ApiPropertyOptional({ enum: TournamentMatchStatus })
  @IsOptional()
  @IsEnum(TournamentMatchStatus)
  status?: TournamentMatchStatus;
}

export class RecordResultDto {
  @ApiProperty({ example: 'user_id_победителя' })
  @IsString()
  winnerId!: string;

  @ApiPropertyOptional({ example: 12.4 })
  @IsOptional()
  @IsNumber()
  scoreA?: number;

  @ApiPropertyOptional({ example: -3.1 })
  @IsOptional()
  @IsNumber()
  scoreB?: number;
}
