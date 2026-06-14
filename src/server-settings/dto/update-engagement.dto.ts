import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WelcomeSelectionStrategy } from '../../database/entities/server-engagement-config.entity';

export class UpdateEngagementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  systemChannelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  welcomeEnabled?: boolean;

  @ApiPropertyOptional({ enum: WelcomeSelectionStrategy })
  @IsOptional()
  @IsEnum(WelcomeSelectionStrategy)
  welcomeSelectionStrategy?: WelcomeSelectionStrategy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  stickerPromptEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  boostMessageEnabled?: boolean;
}
