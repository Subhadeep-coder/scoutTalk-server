import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinServerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
