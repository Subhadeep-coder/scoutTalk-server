import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServerDto {
  @ApiProperty({ example: 'My Server' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}
