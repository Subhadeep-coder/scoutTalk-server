import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;
}
