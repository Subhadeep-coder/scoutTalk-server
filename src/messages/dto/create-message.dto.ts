import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiPropertyOptional({ description: 'Message content' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @ApiPropertyOptional({ description: 'Reply to message id' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Attachments uploaded via /channels/:id/attachments',
    type: [Object],
    example: [
      {
        url: 'https://res.cloudinary.com/...',
        type: 'image/png',
        name: 'screenshot.png',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  attachments?: Array<{ url: string; type: string; name?: string }>;
}
