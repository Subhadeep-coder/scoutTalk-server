import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SetActiveTagDto {
  @ApiPropertyOptional({
    description: 'Server ID whose tag to display, or null to clear',
  })
  @IsOptional()
  @IsUUID()
  serverId?: string;
}
