import { IsString, IsOptional, IsBoolean, IsInt, Min, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWelcomeMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
