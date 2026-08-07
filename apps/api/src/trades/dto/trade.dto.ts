import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Direction, TradeSession } from '@prisma/client';

export class CreateTradeDto {
  @ApiProperty({ example: 'XAUUSD' })
  @IsString()
  asset!: string;

  @ApiProperty({ enum: Direction })
  @IsEnum(Direction)
  direction!: Direction;

  @ApiPropertyOptional({ example: 3240 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  entry?: number;

  @ApiPropertyOptional({ example: 3290 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  exit?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lots?: number;

  @ApiPropertyOptional({ example: 3240 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pnl?: number;

  @ApiPropertyOptional({ example: 3.4 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rMultiplier?: number;

  @ApiPropertyOptional({ enum: TradeSession })
  @IsOptional()
  @IsEnum(TradeSession)
  session?: TradeSession;

  @ApiPropertyOptional({ example: '2026-07-30T12:00:00.000Z' })
  @IsOptional()
  @IsString()
  entryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exitDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'https://www.tradingview.com/x/abc123/' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  flagged?: boolean;

  @ApiPropertyOptional({ example: ['trend', 'news'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

export class UpdateTradeDto extends CreateTradeDto {}

export class QueryTradesDto {
  @ApiPropertyOptional({ enum: TradeSession })
  @IsOptional()
  @IsEnum(TradeSession)
  session?: TradeSession;

  @ApiPropertyOptional({ enum: Direction })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @ApiPropertyOptional({ example: 'Funded #12' })
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional({ enum: ['pos', 'neg'] })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ enum: ['date', 'pnl', 'r'] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  take?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsString()
  includeDeleted?: string;
}
