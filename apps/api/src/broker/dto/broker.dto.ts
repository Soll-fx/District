import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BrokerApiProvider {
  MOCK = 'mock',
  METAPI = 'metapi',
}

export class ConnectBrokerDto {
  @ApiProperty({ enum: BrokerApiProvider, default: BrokerApiProvider.MOCK })
  @IsEnum(BrokerApiProvider)
  apiProvider!: BrokerApiProvider;

  @ApiPropertyOptional({ example: '6012345' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  accountId?: string;

  @ApiProperty({ example: 'demo12345' })
  @IsString()
  @Length(1, 64)
  login!: string;

  @ApiProperty({ example: 'ICMarkets-Demo' })
  @IsString()
  @Length(1, 128)
  serverName!: string;
}

export class DisconnectBrokerDto {
  @ApiProperty()
  @IsString()
  id!: string;
}
