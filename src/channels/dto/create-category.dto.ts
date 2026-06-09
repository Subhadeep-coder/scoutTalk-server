import {
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;

  @ApiProperty()
  @IsUUID()
  serverId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  position?: number;
}
