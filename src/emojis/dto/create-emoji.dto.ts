import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmojiDto {
  @ApiProperty({ example: 'pepe', description: 'Emoji name, used as :pepe:' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name: string;
}
