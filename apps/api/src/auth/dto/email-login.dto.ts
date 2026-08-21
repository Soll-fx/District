import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailLoginDto {
  @ApiProperty({ example: 'sollo@example.com' })
  @IsEmail()
  email!: string;
}
