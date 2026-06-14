import { IsUUID, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderChannelsDto {
  @ApiProperty({ description: 'Server ID the channels belong to' })
  @IsUUID()
  serverId: string;

  @ApiProperty({
    type: String,
    description: 'Category ID (omit or null for uncategorized channels)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({
    description: 'Array of channel IDs in the new order (must include all channels in this category)',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  order: string[];
}
