import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWelcomeMessageDto {
  @ApiProperty({ example: 'Welcome {user} to the server!' })
  @IsString()
  @Length(1, 2000)
  content: string;

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
