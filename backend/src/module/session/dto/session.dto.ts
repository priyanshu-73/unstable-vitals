import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Unique ID for the session (auto-generated if not provided)',
    example: 'a1b2c3d4',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Name of exercise performed in this session',
    example: 'shoulder_press',
  })
  @IsString()
  exerciseName: string;

  @ApiProperty({
    description: 'Session start time as ISO string',
    example: '2025-11-14T10:00:00Z',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'Session end time as ISO string',
    example: '2025-11-14T10:15:00Z',
  })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Emergency status for the session',
    example: false,
    default: false,
  })
  @IsOptional()
  emergency?: boolean;
}
