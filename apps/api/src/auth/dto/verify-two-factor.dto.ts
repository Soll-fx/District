import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTwoFactorDto {
  @ApiProperty({ example: '...' })
  @IsString()
  twoFactorToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 16)
  code!: string;
}
