import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderRolesDto {
  @ApiProperty({
    description: 'Role IDs in the desired order (ascending position)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  order: string[];
}
