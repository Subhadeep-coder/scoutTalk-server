import { ApiProperty } from '../decorators/api-decorators';
import { IsNotEmpty, IsString } from 'class-validator';

export class MobileGoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token from Android/iOS app',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
