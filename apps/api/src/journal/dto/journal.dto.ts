import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalAttachmentDto {
  @ApiProperty({ example: '/uploads/journal/1699999999999_abcd.jpg' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'скрин.png' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;
}

export class CreateJournalEntryDto {
  @ApiPropertyOptional({ example: 'Разбор недели' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ example: 'Текст заметки…' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [JournalAttachmentDto], maxItems: 12 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => JournalAttachmentDto)
  attachments?: JournalAttachmentDto[];
}

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ example: 'Разбор недели' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Текст заметки…' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: [JournalAttachmentDto], maxItems: 12 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => JournalAttachmentDto)
  attachments?: JournalAttachmentDto[];
}