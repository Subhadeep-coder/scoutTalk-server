import { ApiProperty } from '../decorators/api-decorators';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'The refresh token to exchange for a new access token',
  })
  @IsNotEmpty()
  refresh_token: string;
}