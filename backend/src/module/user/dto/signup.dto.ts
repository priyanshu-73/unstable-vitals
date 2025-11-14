import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Unstable Vitals' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'unstable@vitals.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'unstableVitals123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'parent-unstable@example.com' })
  @IsEmail()
  guardianEmail: string;
}
