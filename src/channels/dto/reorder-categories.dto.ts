import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderCategoriesDto {
  @ApiProperty({ description: 'Server ID the categories belong to' })
  @IsUUID()
  serverId: string;

  @ApiProperty({
    description:
      'Array of category IDs in the new order (must include all categories)',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  order: string[];
}
