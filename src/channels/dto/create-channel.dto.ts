import {
  IsString,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '../../database/entities/channel.entity';

export class CreateChannelDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @ApiProperty()
  @IsUUID()
  serverId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: ChannelType, default: ChannelType.TEXT })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;
}
