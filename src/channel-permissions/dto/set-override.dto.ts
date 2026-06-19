import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetOverrideDto {
  @ApiProperty({ description: 'BigInt bitmask for allowed permissions' })
  @IsString()
  allow: string;

  @ApiProperty({ description: 'BigInt bitmask for denied permissions' })
  @IsString()
  deny: string;
}
