import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersBulkDto {
  @ApiProperty({
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
