import { ApiProperty } from '@nestjs/swagger';

export class EmojiResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serverId: string;

  @ApiProperty({ example: 'pepe' })
  name: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;
}
