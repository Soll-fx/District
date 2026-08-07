import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreamType } from '@prisma/client';

export class CreateStreamDto {
  @ApiProperty({ example: 'Разбор сделок за неделю' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiPropertyOptional({ example: 'Разбираем лучшие входы недели' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=abc123' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ example: 'youtube' })
  @IsOptional()
  @IsEnum(StreamType)
  type?: StreamType;

  @ApiPropertyOptional({ example: 'https://example.com/thumb.jpg' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'razbor_2026.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class UpdateStreamDto {
  @ApiPropertyOptional({ example: 'Разбор сделок за неделю' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: 'youtube' })
  @IsOptional()
  @IsEnum(StreamType)
  type?: StreamType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class ToggleReactionDto {
  @ApiProperty({ example: '🔥' })
  @IsString()
  @Length(1, 8)
  emoji!: string;
}

export class StreamQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  includeMine?: boolean;
}
