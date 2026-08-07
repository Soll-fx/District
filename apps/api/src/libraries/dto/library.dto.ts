import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiPropertyOptional({ example: 'Тренд' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '#7C6CF0' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateAssetDto {
  @ApiPropertyOptional({ example: 'XAU' })
  @IsString()
  symbol!: string;

  @ApiPropertyOptional({ example: 'Золото' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'metals' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateStrategyDto {
  @ApiPropertyOptional({ example: 'Разворот от зоны' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meta?: string;

  @ApiPropertyOptional({ example: '#14B8A6' })
  @IsOptional()
  @IsString()
  color?: string;
}
