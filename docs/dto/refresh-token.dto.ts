import { ApiProperty } from '../decorators/api-decorators';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'd4489926-e2ca-49c6-98a1-ef5831a91c27',
    description: 'The refresh token to exchange for a new access token',
  })
  @IsNotEmpty()
  refresh_token: string;
}