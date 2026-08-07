import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Direction, IdeaStatus } from '@prisma/client';

export class CreateIdeaDto {
  @ApiProperty({ example: 'EURUSD' })
  @IsString()
  asset!: string;

  @ApiProperty({ enum: Direction })
  @IsEnum(Direction)
  direction!: Direction;

  @ApiPropertyOptional({ example: '1.0855' })
  @IsOptional()
  @IsString()
  entry?: string;

  @ApiPropertyOptional({ example: '1.0940' })
  @IsOptional()
  @IsString()
  tp?: string;

  @ApiPropertyOptional({ example: '1.0820' })
  @IsOptional()
  @IsString()
  sl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thesis?: string;

  @ApiPropertyOptional({ example: 'https://www.tradingview.com/x/abc123/' })
  @IsOptional()
  @IsString()
  tvLink?: string;

  @ApiPropertyOptional({ enum: IdeaStatus })
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;
}

export class QueryIdeasDto {
  @ApiPropertyOptional({ enum: IdeaStatus })
  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsString()
  includeDeleted?: string;
}

export class UpdateIdeaDto {
  @ApiPropertyOptional({ example: 'EURUSD' })
  @IsOptional()
  @IsString()
  asset?: string;

  @ApiPropertyOptional({ enum: Direction })
  @IsOptional()
  @IsEnum(Direction)
  direction?: Direction;

  @ApiPropertyOptional({ example: '1.0855' })
  @IsOptional()
  @IsString()
  entry?: string;

  @ApiPropertyOptional({ example: '1.0940' })
  @IsOptional()
  @IsString()
  tp?: string;

  @ApiPropertyOptional({ example: '1.0820' })
  @IsOptional()
  @IsString()
  sl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thesis?: string;

  @ApiPropertyOptional({ example: 'https://www.tradingview.com/x/abc123/' })
  @IsOptional()
  @IsString()
  tvLink?: string;
}
