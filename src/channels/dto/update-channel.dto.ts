import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChannelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Transform(({ value }) => value.toLowerCase())
  name?: string;

  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsUUID()
  // categoryId?: string;
}
