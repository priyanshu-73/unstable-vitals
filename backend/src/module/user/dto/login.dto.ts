import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'unstable@vitals.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'unstableVitals123' })
  @IsString()
  password: string;
}
