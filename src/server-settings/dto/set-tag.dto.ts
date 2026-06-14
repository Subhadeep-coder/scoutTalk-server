import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetTagDto {
  @ApiProperty({ example: 'GAME', maxLength: 4 })
  @IsString()
  @MinLength(1)
  @MaxLength(4)
  tag: string;

  @ApiPropertyOptional({ description: 'URL or emoji for tag icon' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#5865F2' })
  @IsOptional()
  @IsString()
  color?: string;
}
