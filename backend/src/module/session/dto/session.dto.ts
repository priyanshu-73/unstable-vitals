import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Unique ID for the session (auto-generated if not provided)',
    example: 'a1b2c3d4',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Name of exercise performed in this session',
    example: 'shoulder_press',
  })
  @IsString()
  exerciseName: string;
}
